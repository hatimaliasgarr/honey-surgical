"use client";

import { useState } from "react";
import { Save, Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Category } from "@/lib/types/catalog";

export function CategoryForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const byId = new Map(categories.map((category) => [category.id, category]));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const url = editingCategory
      ? `/api/admin/categories/${editingCategory.id}`
      : "/api/admin/categories";
    const method = editingCategory ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          parentId: formData.get("parentId") || null,
          description: formData.get("description"),
          imageUrl: formData.get("imageUrl"),
          sortOrder: formData.get("sortOrder"),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(editingCategory ? "Category updated." : "Category created.");
        setEditingCategory(null);
        router.refresh();
      } else {
        setMessage(data.error || "Category could not be saved.");
      }
    } catch (err: any) {
      setMessage("Error saving category.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function remove(category: Category) {
    const ok = window.confirm(`Delete category "${category.name}"?`);
    if (!ok) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("Category deleted.");
        setEditingCategory(null);
        router.refresh();
      } else {
        setMessage(data.error || "Category could not be deleted.");
      }
    } catch (err: any) {
      setMessage("Error deleting category.");
    }
  }

  return (
    <div className="grid gap-6">
      <form
        key={editingCategory?.id || "new"}
        onSubmit={submit}
        className="grid gap-4 rounded-lg border border-border bg-white p-5 shadow-sm"
      >
        <div>
          <h2 className="text-xl font-semibold">
            {editingCategory ? "Edit Category" : "Create Category"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {editingCategory
              ? "Update the hierarchy, description, image, or sort order."
              : "Nested categories support the full product hierarchy."}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={editingCategory?.name || ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="parentId">Parent category</Label>
            <Select
              id="parentId"
              name="parentId"
              defaultValue={editingCategory?.parentId || ""}
            >
              <option value="">Top level</option>
              {categories
                .filter(
                  (category) =>
                    !category.parentId &&
                    (!editingCategory || category.id !== editingCategory.id)
                )
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </Select>
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            required
            defaultValue={editingCategory?.description || ""}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_160px]">
          <div className="grid gap-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              type="url"
              defaultValue={editingCategory?.imageUrl || ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sortOrder">Sort order</Label>
            <Input
              id="sortOrder"
              name="sortOrder"
              type="number"
              defaultValue={editingCategory?.sortOrder ?? "1"}
              min="0"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            <Save aria-hidden="true" className="mr-2 h-4 w-4" />
            {isSubmitting
              ? "Saving..."
              : editingCategory
              ? "Save Changes"
              : "Save Category"}
          </Button>
          {editingCategory && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingCategory(null)}
            >
              <X aria-hidden="true" className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
        {message ? (
          <p className="text-sm text-muted-foreground">{message}</p>
        ) : null}
      </form>

      <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Categories</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Sort</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    {category.parentId ? "- " : ""}
                    {category.name}
                  </TableCell>
                  <TableCell>
                    {category.parentId ? (
                      byId.get(category.parentId)?.name
                    ) : (
                      <Badge variant="beige">Top level</Badge>
                    )}
                  </TableCell>
                  <TableCell>{category.slug}</TableCell>
                  <TableCell>{category.sortOrder}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`Edit ${category.name}`}
                        onClick={() => setEditingCategory(category)}
                      >
                        <Pencil aria-hidden="true" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`Delete ${category.name}`}
                        onClick={() => remove(category)}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
