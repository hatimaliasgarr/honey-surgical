"use client";

import { useState } from "react";
import { Save, Pencil, Trash2, X, ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProductTemplate } from "@/lib/types/catalog";

export function TemplateForm({ templates }: { templates: ProductTemplate[] }) {
  const router = useRouter();
  const [editingTemplate, setEditingTemplate] = useState<ProductTemplate | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name")?.toString().trim();
    const shortDescription = formData.get("shortDescription")?.toString().trim() || "";
    const description = formData.get("description")?.toString().trim() || "";
    const specificationsRaw = formData.get("specifications")?.toString().trim() || "[]";
    const featuresRaw = formData.get("features")?.toString().trim() || "";
    const keywordsRaw = formData.get("keywords")?.toString().trim() || "";

    // Parse specifications JSON
    let specifications = [];
    try {
      specifications = JSON.parse(specificationsRaw);
      if (!Array.isArray(specifications)) {
        throw new Error("Specifications must be a JSON Array.");
      }
      for (const item of specifications) {
        if (typeof item !== "object" || !item.label || !item.value) {
          throw new Error("Each specification object must contain 'label' and 'value'.");
        }
      }
    } catch (err: any) {
      setMessage(`Specifications JSON error: ${err.message || "Invalid JSON array format."}`);
      setIsSubmitting(false);
      return;
    }

    // Process features and keywords
    const features = featuresRaw
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);
    const keywords = keywordsRaw
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const url = editingTemplate
      ? `/api/admin/templates/${editingTemplate.id}`
      : "/api/admin/templates";
    const method = editingTemplate ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          shortDescription,
          description,
          specifications,
          features,
          keywords,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(editingTemplate ? "Template updated." : "Template created.");
        setEditingTemplate(null);
        event.currentTarget.reset();
        router.refresh();
      } else {
        setMessage(data.error || "Template could not be saved.");
      }
    } catch (err: any) {
      setMessage("Error saving template.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function remove(template: ProductTemplate) {
    const ok = window.confirm(`Delete template "${template.name}"?`);
    if (!ok) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/templates/${template.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("Template deleted.");
        setEditingTemplate(null);
        router.refresh();
      } else {
        setMessage(data.error || "Template could not be deleted.");
      }
    } catch (err: any) {
      setMessage("Error deleting template.");
    }
  }

  return (
    <div className="grid gap-6">
      <form
        key={editingTemplate?.id || "new"}
        onSubmit={submit}
        className="grid gap-4 rounded-lg border border-border bg-white p-5 shadow-sm"
      >
        <div>
          <h2 className="text-xl font-semibold">
            {editingTemplate ? "Edit Template" : "Create Preset Template"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Presets define descriptions, JSON specs, features, and keywords that can be loaded in 1-click while creating products.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            name="name"
            required
            placeholder="e.g. ICU Ventilator Preset, General Surgical Glove"
            defaultValue={editingTemplate?.name || ""}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="shortDescription">Short description</Label>
          <Input
            id="shortDescription"
            name="shortDescription"
            placeholder="Brief overview of the product class"
            defaultValue={editingTemplate?.shortDescription || ""}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Full Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Enter standard template description copy"
            defaultValue={editingTemplate?.description || ""}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="specifications">Specifications JSON Array</Label>
            <Textarea
              id="specifications"
              name="specifications"
              className="font-mono text-xs"
              defaultValue={
                editingTemplate
                  ? JSON.stringify(editingTemplate.specifications, null, 2)
                  : '[{"label":"Material","value":"Stainless steel"}]'
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="features">Features</Label>
            <Textarea
              id="features"
              name="features"
              placeholder="One feature per line"
              defaultValue={editingTemplate?.features.join("\n") || ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="keywords">Keywords</Label>
            <Textarea
              id="keywords"
              name="keywords"
              placeholder="comma, separated, keywords"
              defaultValue={editingTemplate?.keywords.join(", ") || ""}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            <Save aria-hidden="true" className="mr-2 h-4 w-4" />
            {isSubmitting
              ? "Saving..."
              : editingTemplate
              ? "Save Changes"
              : "Save Template"}
          </Button>
          {editingTemplate && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingTemplate(null)}
            >
              <X aria-hidden="true" className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
        {message ? (
          <p className="text-sm font-medium text-medical-deep" role="status">
            {message}
          </p>
        ) : null}
      </form>

      <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-lg text-medical-deep mb-4 flex items-center gap-2">
          <ClipboardList className="size-5" />
          Preset Templates
        </h2>
        
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No templates created yet. Fill out the form above to add your first template.</p>
        ) : (
          <>
            {/* Mobile Card List View */}
            <div className="grid gap-4 md:hidden">
              {templates.map((template) => (
                <div 
                  key={template.id} 
                  className="flex flex-col gap-2 rounded-xl border border-border/80 bg-medical-bluePale/5 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-bold text-sm text-medical-deep leading-tight">
                      {template.name}
                    </span>
                  </div>

                  <div className="text-xs border-t border-border/40 pt-2.5 mt-1 grid gap-1">
                    <span className="text-muted-foreground block truncate">
                      <strong>Keywords:</strong> {template.keywords.join(", ") || "None"}
                    </span>
                    <span className="text-muted-foreground block">
                      <strong>Specs:</strong> {template.specifications.length} fields
                    </span>
                    <span className="text-muted-foreground block">
                      <strong>Features:</strong> {template.features.length} features
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-2 mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={`Edit ${template.name}`}
                      onClick={() => setEditingTemplate(template)}
                      className="h-8 text-xs gap-1.5"
                    >
                      <Pencil aria-hidden="true" className="size-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={`Delete ${template.name}`}
                      onClick={() => remove(template)}
                      className="h-8 text-xs gap-1.5 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 aria-hidden="true" className="size-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop List View */}
            <div className="hidden md:block overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm text-left text-foreground">
                <thead className="bg-secondary/40 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                  <tr>
                    <th className="px-4 py-3">Template Name</th>
                    <th className="px-4 py-3">Specs Count</th>
                    <th className="px-4 py-3">Features</th>
                    <th className="px-4 py-3">Keywords</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {templates.map((template) => (
                    <tr key={template.id} className="hover:bg-secondary/10">
                      <td className="px-4 py-3 font-medium text-medical-deep">{template.name}</td>
                      <td className="px-4 py-3 font-mono text-xs">{template.specifications.length} fields</td>
                      <td className="px-4 py-3 text-xs">{template.features.length} lines</td>
                      <td className="px-4 py-3 text-xs truncate max-w-[200px]" title={template.keywords.join(", ")}>
                        {template.keywords.join(", ") || "None"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label={`Edit ${template.name}`}
                            onClick={() => setEditingTemplate(template)}
                          >
                            <Pencil aria-hidden="true" className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label={`Delete ${template.name}`}
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => remove(template)}
                          >
                            <Trash2 aria-hidden="true" className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
