"use client";

import { Fragment, useEffect, useState } from "react";
import {
  fetchAdminCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  type AdminCategory,
} from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addName, setAddName] = useState("");
  const [addSlug, setAddSlug] = useState("");
  const [addParentId, setAddParentId] = useState("");
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editParentId, setEditParentId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadCategories = () => {
    setLoading(true);
    fetchAdminCategories().then((data) => {
      setCategories(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAdd = async () => {
    const name = addName.trim();
    if (!name) {
      setSubmitError("Category name is required.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const created = await adminCreateCategory({
      name,
      slug: addSlug.trim() || undefined,
      parentCategoryId: addParentId.trim() || undefined,
    });
    setSubmitting(false);
    if (created) {
      setCategories((prev) => [...(prev ?? []), created]);
      setShowAddForm(false);
      setAddName("");
      setAddSlug("");
      setAddParentId("");
    } else {
      setSubmitError("Failed to create category. Check slug uniqueness.");
    }
  };

  const startEdit = (cat: AdminCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditSlug(cat.slug);
    setEditParentId(cat.parentCategoryId ?? "");
    setSubmitError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditSlug("");
    setEditParentId("");
    setSubmitError(null);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setSubmitting(true);
    setSubmitError(null);
    const updated = await adminUpdateCategory(editingId, {
      name: editName.trim() || undefined,
      slug: editSlug.trim() || undefined,
      parentCategoryId: editParentId.trim() || null,
    });
    setSubmitting(false);
    if (updated) {
      setCategories((prev) =>
        prev?.map((c) => (c.id === editingId ? updated : c)) ?? prev
      );
      cancelEdit();
    } else {
      setSubmitError("Failed to update category. Check slug uniqueness.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    setActionError(null);
    if (!confirm(`Delete category "${name}"? Products in this category must be moved first.`))
      return;
    setDeleting(id);
    const result = await adminDeleteCategory(id);
    setDeleting(null);
    if (result.success) {
      setCategories((prev) => prev?.filter((c) => c.id !== id) ?? prev);
    } else {
      setActionError({
        id,
        message: result.conflict ?? result.message,
      });
    }
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return "—";
    const parent = categories?.find((c) => c.id === parentId);
    return parent?.name ?? parentId;
  };

  const filtered = categories?.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      getParentName(c.parentCategoryId).toLowerCase().includes(q)
    );
  });

  if (loading) return <p className="py-8 text-white/60">Loading categories…</p>;

  if (categories === null) {
    return (
      <p className="py-8 text-white/60">
        Unable to load categories. Check backend connectivity.
      </p>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1
          className="text-2xl font-bold uppercase tracking-tight text-white sm:text-4xl"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Categories
        </h1>
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search name, slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 bg-white/5"
          />
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-[#FF4D00] font-medium uppercase tracking-wider text-white hover:bg-[#FF4D00]/90"
          >
            {showAddForm ? "Cancel" : "+ New Category"}
          </Button>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-6 rounded-lg border border-white/10 bg-white/5 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">
            Add Category
          </h2>
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Name *"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              className="w-48 bg-white/5"
            />
            <Input
              placeholder="Slug (optional)"
              value={addSlug}
              onChange={(e) => setAddSlug(e.target.value)}
              className="w-40 bg-white/5"
            />
            <Input
              placeholder="Parent category ID (optional)"
              value={addParentId}
              onChange={(e) => setAddParentId(e.target.value)}
              className="w-48 bg-white/5"
            />
            <Button
              onClick={handleAdd}
              disabled={submitting}
              className="bg-[#FF4D00] text-white hover:bg-[#FF4D00]/90"
            >
              {submitting ? "…" : "Create"}
            </Button>
          </div>
          {submitError && (
            <p className="mt-2 text-xs text-red-400">{submitError}</p>
          )}
        </div>
      )}

      {(filtered?.length ?? 0) === 0 ? (
        <p className="py-8 text-white/60">
          {search.trim() ? "No categories match your search." : "No categories yet."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-4 py-3 font-medium text-white">Name</th>
                <th className="px-4 py-3 font-medium text-white">Slug</th>
                <th className="px-4 py-3 font-medium text-white">Parent</th>
                <th className="px-4 py-3 font-medium text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered?.map((cat) => (
                <Fragment key={cat.id}>
                  <tr className="bg-[#1A1A1A]/50">
                    {editingId === cat.id ? (
                      <>
                        <td className="px-4 py-3">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-40 bg-white/5"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={editSlug}
                            onChange={(e) => setEditSlug(e.target.value)}
                            className="w-32 bg-white/5"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={editParentId}
                            onChange={(e) => setEditParentId(e.target.value)}
                            placeholder="(empty = root)"
                            className="w-36 bg-white/5"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            onClick={handleUpdate}
                            disabled={submitting}
                            className="mr-2 bg-[#FF4D00] text-white hover:bg-[#FF4D00]/90"
                          >
                            {submitting ? "…" : "Save"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                            disabled={submitting}
                          >
                            Cancel
                          </Button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-medium text-white">{cat.name}</td>
                        <td className="px-4 py-3 text-white/80">{cat.slug}</td>
                        <td className="px-4 py-3 text-white/80">
                          {getParentName(cat.parentCategoryId)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEdit(cat)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(cat.id, cat.name)}
                              disabled={deleting === cat.id}
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                              {deleting === cat.id ? "…" : "Delete"}
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                  {actionError?.id === cat.id && (
                    <tr className="bg-red-500/5">
                      <td colSpan={4} className="px-4 py-2 text-xs text-red-300">
                        {actionError.message}
                      </td>
                    </tr>
                  )}
                  {editingId === cat.id && submitError && (
                    <tr className="bg-red-500/5">
                      <td colSpan={4} className="px-4 py-2 text-xs text-red-300">
                        {submitError}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-white/40">
        {filtered?.length ?? 0} of {categories.length} categories shown
      </p>
    </>
  );
}
