import { Link, useSearchParams } from "react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Loader2, Plus, Pencil, Tag, Layers, X, Folder, Check } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import type { Category, Subcategory } from "@/lib/films";
import { useContent } from "@/lib/content";
import { Button } from "@/components/ui/button";
import {
  ConfirmButton,
  EmptyState,
  Field,
  PageHead,
  SelectInput,
  TextArea,
  TextInput,
  reportError,
} from "@/pages/admin/ui";

const emptyCategory = { name: "", description: "", accent: "#7CFF3D", order: 0 };
const emptySubcategory = { name: "", category: "", order: 0 };

export function CategoriesSection() {
  const { refresh: refreshContent } = useContent();
  const [params, setParams] = useSearchParams();
  const editId = params.get("edit");
  const tabParam = params.get("tab");

  // Tab & mode state
  const [activeTab, setActiveTab] = useState<"categories" | "subcategories">(
    tabParam === "subcategories" ? "subcategories" : "categories",
  );
  const [formMode, setFormMode] = useState<"category" | "subcategory">("category");

  // Category state
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [categoryBusy, setCategoryBusy] = useState(false);

  // Subcategory state
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [subForm, setSubForm] = useState(emptySubcategory);
  const [subBusy, setSubBusy] = useState(false);
  const [subFilter, setSubFilter] = useState("");

  // Inline quick-add subcategory on a category card
  const [quickCatId, setQuickCatId] = useState<string | null>(null);
  const [quickSubName, setQuickSubName] = useState("");
  const [quickSubBusy, setQuickSubBusy] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.get<Category[]>("/api/categories");
      setItems(list);
      const target = editId ? list.find((category) => category._id === editId) : undefined;
      if (target) {
        setEditingCategoryId(target._id);
        setCategoryForm({
          name: target.name,
          description: target.description ?? "",
          accent: target.accent ?? "#7CFF3D",
          order: target.order ?? 0,
        });
        setFormMode("category");
      }
    } catch (error) {
      reportError(error, "Could not load categories");
    } finally {
      setLoading(false);
    }
  }, [editId]);

  const loadSubcategories = useCallback(async (filterSlug = "") => {
    setSubLoading(true);
    try {
      const query = filterSlug ? `?category=${encodeURIComponent(filterSlug)}` : "";
      const list = await api.get<Subcategory[]>(`/api/subcategories${query}`);
      setSubcategories(list);
    } catch (error) {
      reportError(error, "Could not load subcategories");
    } finally {
      setSubLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadSubcategories(subFilter);
  }, [loadSubcategories, subFilter]);

  // Form mode openers
  const startCreateCategory = () => {
    setFormMode("category");
    setEditingCategoryId(null);
    setCategoryForm(emptyCategory);
  };

  const startEditCategory = (category: Category) => {
    setFormMode("category");
    setEditingCategoryId(category._id);
    setCategoryForm({
      name: category.name,
      description: category.description ?? "",
      accent: category.accent ?? "#7CFF3D",
      order: category.order ?? 0,
    });
  };

  const startCreateSubcategory = (preferredCatId?: string) => {
    setFormMode("subcategory");
    setEditingSubId(null);
    setSubForm({
      ...emptySubcategory,
      category: preferredCatId || items[0]?._id || "",
    });
  };

  const startEditSubcategory = (sub: Subcategory) => {
    setFormMode("subcategory");
    setEditingSubId(sub._id);
    setSubForm({
      name: sub.name,
      category: sub.category?._id ?? "",
      order: sub.order ?? 0,
    });
  };

  // Submits
  const submitCategory = async (event: FormEvent) => {
    event.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error("Please enter a category name");
      return;
    }
    setCategoryBusy(true);
    try {
      const payload = {
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim(),
        accent: categoryForm.accent.trim(),
        order: Number(categoryForm.order) || 0,
      };
      if (editingCategoryId) {
        await api.put(`/api/categories/${editingCategoryId}`, payload, { auth: true });
        toast.success("Category updated");
      } else {
        await api.post("/api/categories", payload, { auth: true });
        toast.success("Category created");
      }
      setEditingCategoryId(null);
      setCategoryForm(emptyCategory);
      await loadCategories();
      await refreshContent();
    } catch (error) {
      reportError(error);
    } finally {
      setCategoryBusy(false);
    }
  };

  const submitSubcategory = async (event: FormEvent) => {
    event.preventDefault();
    if (!subForm.name.trim()) {
      toast.error("Please enter a subcategory name");
      return;
    }
    if (!subForm.category) {
      toast.error("Please select a parent category");
      return;
    }
    setSubBusy(true);
    try {
      const payload = {
        name: subForm.name.trim(),
        category: subForm.category,
        order: Number(subForm.order) || 0,
      };
      if (editingSubId) {
        await api.put(`/api/subcategories/${editingSubId}`, payload, { auth: true });
        toast.success("Subcategory updated");
      } else {
        await api.post("/api/subcategories", payload, { auth: true });
        toast.success("Subcategory created");
      }
      setEditingSubId(null);
      setSubForm(emptySubcategory);
      await loadSubcategories(subFilter);
      await refreshContent();
    } catch (error) {
      reportError(error);
    } finally {
      setSubBusy(false);
    }
  };

  const handleQuickAddSubcategory = async (category: Category) => {
    if (!quickSubName.trim()) {
      toast.error("Please enter a subcategory name");
      return;
    }
    setQuickSubBusy(true);
    try {
      await api.post(
        "/api/subcategories",
        {
          name: quickSubName.trim(),
          category: category._id,
          order: 0,
        },
        { auth: true },
      );
      toast.success(`Subcategory "${quickSubName.trim()}" added to ${category.name}!`);
      setQuickSubName("");
      setQuickCatId(null);
      await loadSubcategories(subFilter);
      await refreshContent();
    } catch (error) {
      reportError(error, "Could not add subcategory");
    } finally {
      setQuickSubBusy(false);
    }
  };

  const removeCategory = async (category: Category) => {
    try {
      const result = await api.del<{ unlinked?: number }>(`/api/categories/${category._id}`, {
        auth: true,
      });
      toast.success(
        result.unlinked
          ? `Category deleted and unlinked from ${result.unlinked} film(s)`
          : "Category deleted",
      );
      await loadCategories();
      await loadSubcategories(subFilter);
      await refreshContent();
    } catch (error) {
      reportError(error);
    }
  };

  const removeSubcategory = async (subcategory: Subcategory) => {
    try {
      const result = await api.del<{ unlinked?: number }>(`/api/subcategories/${subcategory._id}`, {
        auth: true,
      });
      toast.success(
        result.unlinked
          ? `Subcategory deleted and unlinked from ${result.unlinked} film(s)`
          : "Subcategory deleted",
      );
      await loadSubcategories(subFilter);
      await refreshContent();
    } catch (error) {
      reportError(error);
    }
  };

  const categoryOptions = items.map((cat) => ({
    value: cat._id,
    label: cat.name,
  }));

  const getSubcategoriesForCategory = (catId: string) =>
    subcategories.filter((sub) => sub.category?._id === catId);

  return (
    <>
      <PageHead
        title="Categories & Subcategories"
        description="Organize your films catalogue. Create top-level categories and add child subcategories belonging to each."
        action={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              className="rounded-none bg-neutral-900 text-white hover:bg-neutral-800"
              onClick={startCreateCategory}
            >
              <Plus className="h-4 w-4" /> New Category
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-none border-neutral-300 text-neutral-800 hover:bg-neutral-100"
              onClick={() => startCreateSubcategory()}
            >
              <Plus className="h-4 w-4" /> New Subcategory
            </Button>
          </div>
        }
      />

      {/* Top Segmented Tabs: Categories vs Subcategories */}
      <div className="mb-6 flex items-center justify-between border-b border-border pb-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab("categories");
              setParams({});
            }}
            aria-pressed={activeTab === "categories"}
            className={`cursor-pointer px-3.5 py-1.5 font-sans text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === "categories"
                ? "border-b-2 border-neutral-900 text-neutral-900 font-extrabold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Categories ({items.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("subcategories");
              setParams({ tab: "subcategories" });
            }}
            aria-pressed={activeTab === "subcategories"}
            className={`cursor-pointer px-3.5 py-1.5 font-sans text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === "subcategories"
                ? "border-b-2 border-neutral-900 text-neutral-900 font-extrabold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Subcategories ({subcategories.length})
          </button>
        </div>

        <Link
          to="/categories"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-neutral-600 hover:text-black underline"
        >
          View Public Categories →
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
        {/* Left Form: Toggle between Category and Subcategory Form */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border border-border bg-neutral-100 p-1 rounded-none">
            <button
              type="button"
              onClick={() => {
                setFormMode("category");
                setEditingCategoryId(null);
              }}
              className={`flex-1 py-1 font-sans text-xs font-bold uppercase tracking-wider text-center transition-colors cursor-pointer ${
                formMode === "category"
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "text-neutral-700 hover:text-black"
              }`}
            >
              Category Form
            </button>
            <button
              type="button"
              onClick={() => {
                setFormMode("subcategory");
                setEditingSubId(null);
                const first = items[0];
                if (!subForm.category && first) {
                  setSubForm((prev) => ({ ...prev, category: first._id }));
                }
              }}
              className={`flex-1 py-1 font-sans text-xs font-bold uppercase tracking-wider text-center transition-colors cursor-pointer ${
                formMode === "subcategory"
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "text-neutral-700 hover:text-black"
              }`}
            >
              Subcategory Form
            </button>
          </div>

          {formMode === "category" ? (
            /* Category Creation / Edit Form */
            <form
              onSubmit={(event) => void submitCategory(event)}
              className="space-y-5 border border-border bg-card p-5 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <p className="font-display text-xl uppercase">
                  {editingCategoryId ? "Edit category" : "New category"}
                </p>
                {editingCategoryId && (
                  <span className="font-mono text-[10px] uppercase font-bold text-neutral-500">
                    Editing
                  </span>
                )}
              </div>

              <Field label="Name" htmlFor="cat-name">
                <TextInput
                  id="cat-name"
                  required
                  value={categoryForm.name}
                  onChange={(event) =>
                    setCategoryForm({ ...categoryForm, name: event.target.value })
                  }
                  placeholder="e.g. Feature Films"
                />
              </Field>

              <Field label="Description" htmlFor="cat-desc">
                <TextArea
                  id="cat-desc"
                  value={categoryForm.description}
                  onChange={(event) =>
                    setCategoryForm({ ...categoryForm, description: event.target.value })
                  }
                  placeholder="Optional line shown in the catalog."
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Accent" htmlFor="cat-accent">
                  <div className="flex gap-2">
                    <input
                      type="color"
                      aria-label="Category accent color"
                      value={categoryForm.accent}
                      onChange={(event) =>
                        setCategoryForm({ ...categoryForm, accent: event.target.value })
                      }
                      className="h-11 w-12 shrink-0 cursor-pointer border border-border bg-background"
                    />
                    <TextInput
                      id="cat-accent"
                      value={categoryForm.accent}
                      onChange={(event) =>
                        setCategoryForm({ ...categoryForm, accent: event.target.value })
                      }
                    />
                  </div>
                </Field>

                <Field label="Sort order" htmlFor="cat-order">
                  <TextInput
                    id="cat-order"
                    type="number"
                    value={categoryForm.order}
                    onChange={(event) =>
                      setCategoryForm({ ...categoryForm, order: Number(event.target.value) })
                    }
                  />
                </Field>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="submit"
                  className="flex-1 rounded-none bg-neutral-900 text-white hover:bg-neutral-800"
                  disabled={categoryBusy}
                >
                  {categoryBusy && <Loader2 className="animate-spin" />}
                  {editingCategoryId ? "Save category changes" : "Create category"}
                </Button>
                {editingCategoryId && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-none border border-neutral-300 text-neutral-800 hover:bg-neutral-100"
                    onClick={startCreateCategory}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          ) : (
            /* Subcategory Creation / Edit Form */
            <form
              onSubmit={(event) => void submitSubcategory(event)}
              className="space-y-5 border border-border bg-card p-5 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <p className="font-display text-xl uppercase">
                  {editingSubId ? "Edit subcategory" : "New subcategory"}
                </p>
                {editingSubId && (
                  <span className="font-mono text-[10px] uppercase font-bold text-neutral-500">
                    Editing
                  </span>
                )}
              </div>

              <Field label="Subcategory Name" htmlFor="sub-name">
                <TextInput
                  id="sub-name"
                  required
                  value={subForm.name}
                  onChange={(event) => setSubForm({ ...subForm, name: event.target.value })}
                  placeholder="e.g. Neo-Noir, Documentaries"
                />
              </Field>

              <Field label="Parent category" htmlFor="sub-parent">
                <SelectInput
                  value={subForm.category}
                  onValueChange={(value) => setSubForm({ ...subForm, category: value })}
                  options={categoryOptions}
                  placeholder="Choose parent category"
                />
              </Field>

              {items.length === 0 && (
                <p className="border border-border p-3 font-sans text-xs text-muted-foreground">
                  No categories created yet. Please create a parent category first.
                </p>
              )}

              <Field label="Sort order" htmlFor="sub-order">
                <TextInput
                  id="sub-order"
                  type="number"
                  value={subForm.order}
                  onChange={(event) =>
                    setSubForm({ ...subForm, order: Number(event.target.value) })
                  }
                />
              </Field>

              <div className="flex gap-2 pt-1">
                <Button
                  type="submit"
                  className="flex-1 rounded-none bg-neutral-900 text-white hover:bg-neutral-800"
                  disabled={subBusy || items.length === 0}
                >
                  {subBusy && <Loader2 className="animate-spin" />}
                  {editingSubId ? "Save subcategory changes" : "Create subcategory"}
                </Button>
                {editingSubId && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-none border border-neutral-300 text-neutral-800 hover:bg-neutral-100"
                    onClick={() => startCreateSubcategory()}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Right Area: Displays content according to the active tab */}
        {activeTab === "categories" ? (
          /* Categories View with Nested Subcategories */
          <div className="space-y-4">
            {loading ? (
              <p className="flex items-center gap-2 font-sans text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading categories…
              </p>
            ) : items.length === 0 ? (
              <EmptyState>No categories yet — create the first one on the left.</EmptyState>
            ) : (
              items.map((category) => {
                const catSubs = getSubcategoriesForCategory(category._id);
                const isQuickAdding = quickCatId === category._id;

                return (
                  <div
                    key={category._id}
                    className="border border-border bg-card p-4 transition-colors shadow-2xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-9 w-2 shrink-0 rounded-xs"
                          style={{ backgroundColor: category.accent || "#7CFF3D" }}
                          aria-hidden
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-sans text-base font-bold uppercase tracking-tight text-foreground">
                              {category.name}
                            </p>
                            <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-neutral-900 text-white shadow-2xs">
                              {catSubs.length} Subcategor{catSubs.length !== 1 ? "ies" : "y"}
                            </span>
                          </div>
                          <p className="font-mono text-xs text-muted-foreground mt-0.5">
                            /{category.slug}
                            {category.description ? ` · ${category.description}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="rounded-none bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-semibold cursor-pointer"
                          onClick={() => {
                            if (quickCatId === category._id) {
                              setQuickCatId(null);
                              setQuickSubName("");
                            } else {
                              setQuickCatId(category._id);
                              setQuickSubName("");
                            }
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" /> Subcategory
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-none border-neutral-300 text-neutral-800 hover:bg-neutral-100"
                          onClick={() => startEditCategory(category)}
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <ConfirmButton
                          confirmMessage={`Delete category “${category.name}”? Films keep existing, they just lose this link.`}
                          onConfirm={() => removeCategory(category)}
                        />
                      </div>
                    </div>

                    {/* Quick inline subcategory creator under this category card */}
                    {isQuickAdding && (
                      <div className="rounded border border-neutral-300 bg-neutral-50 p-3 space-y-2 shadow-inner">
                        <div className="flex items-center justify-between">
                          <span className="font-sans text-xs font-bold uppercase tracking-wider text-neutral-900">
                            Create Subcategory under "{category.name}"
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuickCatId(null)}
                            className="text-xs text-neutral-500 hover:text-black font-semibold cursor-pointer"
                          >
                            ✕ Close
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <TextInput
                            placeholder="Subcategory name (e.g. Neo-Noir, Short Film, Indie)"
                            value={quickSubName}
                            onChange={(e) => setQuickSubName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                void handleQuickAddSubcategory(category);
                              }
                            }}
                            className="h-8 text-xs bg-white border-neutral-300 flex-1"
                          />
                          <Button
                            type="button"
                            size="sm"
                            disabled={quickSubBusy}
                            onClick={() => void handleQuickAddSubcategory(category)}
                            className="rounded-none bg-neutral-900 text-white hover:bg-neutral-800 text-xs h-8 px-3 font-semibold cursor-pointer"
                          >
                            {quickSubBusy ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Plus className="h-3 w-3" />
                            )}
                            Add Subcategory
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* List of subcategories chips inside this category card */}
                    <div className="border-t border-border/80 pt-2.5">
                      {catSubs.length > 0 ? (
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="font-mono text-[10px] uppercase font-semibold text-neutral-500 mr-1">
                            Subcategories:
                          </span>
                          {catSubs.map((sub) => (
                            <div
                              key={sub._id}
                              className="inline-flex items-center gap-1.5 rounded border border-neutral-300 bg-neutral-100 px-2.5 py-1 text-xs shadow-2xs"
                            >
                              <Tag className="h-3 w-3 text-neutral-600" />
                              <span className="font-bold text-neutral-900">{sub.name}</span>
                              <span className="font-mono text-[10px] text-neutral-500">
                                ({sub.slug})
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  startEditSubcategory(sub);
                                }}
                                className="ml-1 rounded p-0.5 text-neutral-500 hover:bg-neutral-200 hover:text-black cursor-pointer"
                                title={`Edit subcategory ${sub.name}`}
                                aria-label={`Edit subcategory ${sub.name}`}
                              >
                                <Pencil className="h-2.5 w-2.5" />
                              </button>
                              <ConfirmButton
                                confirmMessage={`Delete subcategory "${sub.name}"?`}
                                onConfirm={() => void removeSubcategory(sub)}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="font-sans text-[11px] text-muted-foreground flex items-center justify-between">
                          <span>No subcategories created for this category yet.</span>
                          <button
                            type="button"
                            onClick={() => setQuickCatId(category._id)}
                            className="font-semibold text-neutral-900 hover:underline cursor-pointer"
                          >
                            + Add first subcategory
                          </button>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Comprehensive Subcategories View with Filter */
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 border-b border-border pb-3">
              <button
                type="button"
                onClick={() => setSubFilter("")}
                aria-pressed={subFilter === ""}
                className={`border px-3 py-1 font-sans text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                  subFilter === ""
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                All categories ({subcategories.length})
              </button>
              {items.map((category) => (
                <button
                  key={category._id}
                  type="button"
                  onClick={() => setSubFilter(category.slug)}
                  aria-pressed={subFilter === category.slug}
                  className={`border px-3 py-1 font-sans text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                    subFilter === category.slug
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {category.name} ({getSubcategoriesForCategory(category._id).length})
                </button>
              ))}
            </div>

            {subLoading ? (
              <p className="flex items-center gap-2 font-sans text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading subcategories…
              </p>
            ) : subcategories.length === 0 ? (
              <EmptyState>
                No subcategories found. Use the form on the left or the "+ Subcategory" button on a
                category card to create one.
              </EmptyState>
            ) : (
              <div className="space-y-2">
                {subcategories.map((sub) => (
                  <div
                    key={sub._id}
                    className="flex flex-wrap items-center justify-between gap-4 border border-border bg-card p-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <Tag className="h-4 w-4 text-neutral-700" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-sans text-sm font-bold uppercase tracking-tight text-neutral-900">
                            {sub.name}
                          </p>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            /{sub.slug}
                          </span>
                        </div>
                        <p className="font-sans text-xs text-muted-foreground">
                          Parent:{" "}
                          <span className="font-semibold text-neutral-900">
                            {sub.category?.name || "Unassigned"}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-none border-neutral-300 text-neutral-800 hover:bg-neutral-100"
                        onClick={() => startEditSubcategory(sub)}
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </Button>
                      <ConfirmButton
                        confirmMessage={`Delete subcategory "${sub.name}"?`}
                        onConfirm={() => void removeSubcategory(sub)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
