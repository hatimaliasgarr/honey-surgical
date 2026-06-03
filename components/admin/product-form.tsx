"use client";

import { useState } from "react";
import { ImagePlus, Save, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Brand, Category, Product } from "@/lib/types/catalog";

type SaveState = "idle" | "saving" | "success" | "error";

export function ProductForm({
  categories,
  brands,
  product
}: {
  categories: Category[];
  brands: Brand[];
  product?: Product;
}) {
  const router = useRouter();
  const [images, setImages] = useState<string[]>(product?.images.map((image) => image.url) || []);
  const [state, setState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function uploadFiles(files: FileList | File[]) {
    const items = Array.from(files);
    if (!items.length) {
      return;
    }

    setState("idle");
    setUploading(true);
    setMessage("Preparing secure upload...");

    try {
      const signatureResponse = await fetch("/api/admin/cloudinary/signature", { method: "POST" });
      const signaturePayload = await signatureResponse.json().catch(() => ({}));

      if (!signatureResponse.ok) {
        throw new Error(signaturePayload.error || "Could not prepare the image upload.");
      }

      if (signaturePayload.mode === "demo") {
        throw new Error("Image upload is not configured. Add Cloudinary credentials to save product images.");
      }

      const uploaded: string[] = [];
      for (const file of items) {
        const body = new FormData();
        body.append("file", file);
        body.append("api_key", signaturePayload.apiKey);
        body.append("timestamp", signaturePayload.timestamp);
        body.append("signature", signaturePayload.signature);
        body.append("folder", signaturePayload.folder);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${signaturePayload.cloudName}/image/upload`,
          {
            method: "POST",
            body
          }
        );
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.secure_url) {
          throw new Error(payload.error?.message || `Could not upload ${file.name}.`);
        }

        uploaded.push(payload.secure_url);
      }

      setImages((current) => [...current, ...uploaded]);
      setMessage(`${uploaded.length} image upload${uploaded.length === 1 ? "" : "s"} completed.`);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploading) {
      setState("error");
      setMessage("Wait for image uploads to finish before saving.");
      return;
    }

    const form = event.currentTarget;
    setState("saving");
    setMessage("");

    const formData = new FormData(form);
    const payload = {
      name: formData.get("name"),
      sku: formData.get("sku"),
      categoryId: formData.get("categoryId"),
      brandId: formData.get("brandId"),
      price: formData.get("price"),
      shortDescription: formData.get("shortDescription"),
      description: formData.get("description"),
      specifications: formData.get("specifications"),
      features: formData.get("features"),
      keywords: formData.get("keywords"),
      status: formData.get("status"),
      images
    };

    try {
      const response = await fetch(product ? `/api/admin/products/${product.id}` : "/api/admin/products", {
        method: product ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Product could not be saved.");
      }

      setState("success");
      setMessage(product ? "Product updated." : "Product saved.");

      if (product) {
        if (result.slug && result.slug !== product.slug) {
          router.replace(`/admin/products/${result.slug}`);
        }
        router.refresh();
      } else {
        form.reset();
        setImages([]);
        router.refresh();
      }
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Product could not be saved.");
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-lg border border-border bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold">{product ? "Edit Product" : "Add Product"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Create catalog products with Cloudinary images and Supabase data.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required defaultValue={product?.name} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" name="sku" required defaultValue={product?.sku} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="categoryId">Category</Label>
          <Select id="categoryId" name="categoryId" required defaultValue={product?.category.id || ""}>
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.parentId ? "- " : ""}
                {category.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="brandId">Brand</Label>
          <Select id="brandId" name="brandId" required defaultValue={product?.brand.id || ""}>
            <option value="">Select brand</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="price">Price</Label>
          <Input id="price" name="price" type="number" min="0" step="1" defaultValue={product?.price ?? ""} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="shortDescription">Short description</Label>
        <Input id="shortDescription" name="shortDescription" required defaultValue={product?.shortDescription} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" required defaultValue={product?.description} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="specifications">Specifications JSON</Label>
          <Textarea
            id="specifications"
            name="specifications"
            defaultValue={
              product
                ? JSON.stringify(product.specifications, null, 2)
                : '[{"label":"Material","value":"Stainless steel"}]'
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="features">Features</Label>
          <Textarea id="features" name="features" placeholder="One feature per line" defaultValue={product?.features.join("\n")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="keywords">Keywords</Label>
          <Textarea id="keywords" name="keywords" placeholder="gloves, sterile, disposable" defaultValue={product?.keywords.join(", ")} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="images">Images</Label>
        <label
          htmlFor="images"
          onDrop={(event) => {
            event.preventDefault();
            uploadFiles(event.dataTransfer.files);
          }}
          onDragOver={(event) => event.preventDefault()}
          className="grid cursor-pointer place-items-center rounded-lg border border-dashed border-border bg-secondary p-6 text-center hover:bg-medical-pale"
        >
          <UploadCloud className="size-8 text-primary" aria-hidden="true" />
          <span className="mt-2 text-sm font-medium">Upload single or multiple images</span>
          <span className="text-xs text-muted-foreground">Drag and drop or choose files</span>
        </label>
        <Input
          id="images"
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) {
              uploadFiles(event.target.files);
              event.target.value = "";
            }
          }}
        />
        {images.length ? (
          <div className="flex flex-wrap gap-2">
            {images.map((image, index) => (
              <span key={`${image}-${index}`} className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-2 py-1 text-xs">
                <ImagePlus className="size-4" aria-hidden="true" />
                {image}
                <button type="button" onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                  <X className="size-3" aria-hidden="true" />
                  <span className="sr-only">Remove image</span>
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-2 md:w-56">
        <Label htmlFor="status">Status</Label>
        <Select id="status" name="status" defaultValue={product?.status || "active"}>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </Select>
      </div>

      <Button type="submit" disabled={state === "saving" || uploading}>
        <Save aria-hidden="true" />
        {uploading ? "Uploading..." : state === "saving" ? "Saving..." : product ? "Update Product" : "Save Product"}
      </Button>
      {message ? (
        <p className={state === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"} role={state === "error" ? "alert" : "status"}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
