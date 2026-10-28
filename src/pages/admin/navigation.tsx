import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  CornerDownRight,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { useContent } from "@/lib/content";
import type { MenuSubcategory, NavEntry } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import {
  ConfirmButton,
  EmptyState,
  Field,
  PageHead,
  TextInput,
  reportError,
} from "@/pages/admin/ui";

/** API shape: a NavEntry plus its id, order, visibility flag, and subcategories array. */
type NavigationItem = NavEntry & {
  _id: string;
  order: number;
  visible: boolean;
  subcategories?: MenuSubcategory[];
};

type SubItemState = {
  _id?: string | undefined;
  label: string;
  to: string;
  description: string;
};

const emptySubItem: SubItemState = { label: "", to: "", description: "" };

const empty = {
  label: "",
  to: "",
  subcategories: [] as SubItemState[],
};

/** Ensure paths like "news" become "/news", preserving absolute URLs. */
function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("mailto:")
  ) {
    return trimmed;
  }
  return `/${trimmed}`;
}

export function NavigationSection() {
  const { refresh: refreshContent } = useContent();
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  // Input state for adding or editing a subcategory inside the main form
  const [newSub, setNewSub] = useState<SubItemState>(emptySubItem);
  const [editingSubIndex, setEditingSubIndex] = useState<number | null>(null);

  // Quick inline add state for adding a subnav directly from any card on the right
  const [quickAddId, setQuickAddId] = useState<string | null>(null);
  const [quickSub, setQuickSub] = useState<SubItemState>(emptySubItem);
  const [quickBusy, setQuickBusy] = useState(false);

  // Load all navigation items (including hidden ones)
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.get<NavigationItem[]>("/api/navigation?all=true", { auth: true });
      setItems([...list].sort((a, b) => a.order - b.order));
    } catch (error) {
      reportError(error, "Could not load the menu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const startCreate = () => {
    setEditingId(null);
    setForm(empty);
    setEditingSubIndex(null);
    setNewSub(emptySubItem);
  };

  const startEdit = (item: NavigationItem) => {
    setEditingId(item._id);
    setForm({
      label: item.label,
      to: item.to,
      subcategories: (item.subcategories ?? []).map((s) => ({
        ...(s._id ? { _id: s._id } : {}),
        label: s.label,
        to: s.to,
        description: s.description ?? "",
      })),
    });
    setEditingSubIndex(null);
    setNewSub(emptySubItem);
  };

  const handleSaveSubcategory = () => {
    if (!newSub.label.trim() || !newSub.to.trim()) {
      toast.error("Please enter both a label and a link route for the subcategory");
      return;
    }
    const sanitizedTo = sanitizeUrl(newSub.to);

    if (editingSubIndex !== null) {
      setForm((prev) => {
        const next = [...prev.subcategories];
        const existing = next[editingSubIndex];
        next[editingSubIndex] = {
          ...(existing?._id ? { _id: existing._id } : {}),
          label: newSub.label.trim(),
          to: sanitizedTo,
          description: newSub.description.trim(),
        };
        return { ...prev, subcategories: next };
      });
      toast.success(`Updated subcategory "${newSub.label.trim()}"!`);
      setEditingSubIndex(null);
      setNewSub(emptySubItem);
    } else {
      setForm((prev) => ({
        ...prev,
        subcategories: [
          ...prev.subcategories,
          {
            label: newSub.label.trim(),
            to: sanitizedTo,
            description: newSub.description.trim(),
          },
        ],
      }));
      toast.success(
        `Added subcategory "${newSub.label.trim()}" (${sanitizedTo})! Click "Save changes" below to publish.`,
      );
      setNewSub(emptySubItem);
    }
  };

  const handleEditSubcategory = (index: number) => {
    const target = form.subcategories[index];
    if (!target) return;
    setEditingSubIndex(index);
    setNewSub({
      label: target.label,
      to: target.to,
      description: target.description,
    });
    toast.info(`Editing subcategory "${target.label}". Click "Update Subcategory" when done.`);
  };

  const handleCancelEditSub = () => {
    setEditingSubIndex(null);
    setNewSub(emptySubItem);
  };

  const handleRemoveSubcategory = (index: number) => {
    if (editingSubIndex === index) {
      setEditingSubIndex(null);
      setNewSub(emptySubItem);
    }
    setForm((prev) => ({
      ...prev,
      subcategories: prev.subcategories.filter((_, i) => i !== index),
    }));
  };

  // Submit the left form (creating or editing a main navigation item)
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      // If user typed into the new subcategory fields but didn't click "+ Add Subcategory", automatically include it!
      const finalSubcategories = [...form.subcategories];
      if (newSub.label.trim() && newSub.to.trim()) {
        const sanitizedTo = sanitizeUrl(newSub.to.trim());
        if (editingSubIndex !== null && finalSubcategories[editingSubIndex]) {
          const existing = finalSubcategories[editingSubIndex];
          finalSubcategories[editingSubIndex] = {
            ...(existing?._id ? { _id: existing._id } : {}),
            label: newSub.label.trim(),
            to: sanitizedTo,
            description: newSub.description.trim(),
          };
        } else {
          finalSubcategories.push({
            label: newSub.label.trim(),
            to: sanitizedTo,
            description: newSub.description.trim(),
          });
        }
      }

      const payload = {
        label: form.label.trim(),
        to: sanitizeUrl(form.to.trim()),
        subcategories: finalSubcategories.map((sub) => ({
          label: sub.label.trim(),
          to: sanitizeUrl(sub.to.trim()),
          description: sub.description?.trim() ?? "",
        })),
      };

      if (editingId) {
        await api.put(`/api/navigation/${editingId}`, payload, { auth: true });
        toast.success("Menu item and subnav dropdowns updated successfully");
      } else {
        await api.post("/api/navigation", { ...payload, order: items.length }, { auth: true });
        toast.success("New menu item created with subnavs");
      }

      setEditingId(null);
      setForm(empty);
      setNewSub(emptySubItem);
      await load();
      await refreshContent();
    } catch (error) {
      reportError(error, "Failed to save menu item");
    } finally {
      setBusy(false);
    }
  };

  // Quick inline subnav creation directly on any item card
  const handleQuickAddSubmit = async (item: NavigationItem) => {
    if (!quickSub.label.trim() || !quickSub.to.trim()) {
      toast.error("Please provide both a label and a URL route for the subnav");
      return;
    }
    setQuickBusy(true);
    try {
      const sanitizedTo = sanitizeUrl(quickSub.to.trim());
      const updatedSubcategories = [
        ...(item.subcategories ?? []),
        {
          label: quickSub.label.trim(),
          to: sanitizedTo,
          description: quickSub.description.trim(),
        },
      ];
      await api.put(
        `/api/navigation/${item._id}`,
        { subcategories: updatedSubcategories },
        { auth: true },
      );
      toast.success(`Added subnav "${quickSub.label.trim()}" to ${item.label}!`);
      setQuickAddId(null);
      setQuickSub(emptySubItem);
      await load();
      await refreshContent();
    } catch (error) {
      reportError(error, "Could not add subnav");
    } finally {
      setQuickBusy(false);
    }
  };

  // Quick remove subnav directly from an item card
  const handleQuickRemoveSubnav = async (item: NavigationItem, subIndex: number) => {
    const updated = (item.subcategories ?? []).filter((_, i) => i !== subIndex);
    try {
      await api.put(`/api/navigation/${item._id}`, { subcategories: updated }, { auth: true });
      toast.success("Subnav removed");
      await load();
      await refreshContent();
    } catch (error) {
      reportError(error, "Could not remove subnav");
    }
  };

  const remove = async (item: NavigationItem) => {
    try {
      await api.del(`/api/navigation/${item._id}`, { auth: true });
      toast.success("Menu item deleted");
      await load();
      await refreshContent();
    } catch (error) {
      reportError(error);
    }
  };

  const toggleVisibility = async (item: NavigationItem) => {
    try {
      await api.put(`/api/navigation/${item._id}`, { visible: !item.visible }, { auth: true });
      toast.success(item.visible ? "Hidden from the public menu" : "Back in the public menu");
      await load();
      await refreshContent();
    } catch (error) {
      reportError(error);
    }
  };

  const move = async (index: number, delta: -1 | 1) => {
    const next = [...items];
    const swap = index + delta;
    const current = next[index];
    const neighbour = next[swap];
    if (!current || !neighbour) return;
    next[index] = neighbour;
    next[swap] = current;
    setItems(next);
    try {
      await api.put("/api/navigation", { order: next.map((item) => item._id) }, { auth: true });
      await load();
      await refreshContent();
    } catch (error) {
      reportError(error);
      await load();
    }
  };

  return (
    <>
      <PageHead
        title="Navigation"
        description="The public header menu and footer navigation come straight from this list. You can reorder, hide, rename, and add subnav dropdowns (like News inside About) to any main menu item."
        action={
          <Button
            type="button"
            className="rounded-none bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm font-semibold"
            onClick={startCreate}
          >
            <Plus className="h-4 w-4" /> New menu item
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
        {/* Left Form: Create / Edit Navigation item and its subnavs */}
        <form
          onSubmit={(event) => void submit(event)}
          className="space-y-6 border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between border-b border-border pb-3">
            <p className="font-display text-xl uppercase text-foreground">
              {editingId ? "Edit menu item" : "New menu item"}
            </p>
            {editingId && (
              <span className="rounded bg-neutral-900 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                Editing
              </span>
            )}
          </div>

          <Field label="Main Nav Label" htmlFor="nav-label">
            <TextInput
              id="nav-label"
              required
              value={form.label}
              onChange={(event) => setForm({ ...form, label: event.target.value })}
              placeholder="e.g. About, Movies, Studio"
            />
          </Field>

          <Field
            label="Main Nav Link"
            htmlFor="nav-to"
            hint="A site route like /about, /films, or an external URL."
          >
            <TextInput
              id="nav-to"
              required
              value={form.to}
              onChange={(event) => setForm({ ...form, to: event.target.value })}
              placeholder="/about"
            />
          </Field>

          {/* Subcategory Section (Dropdown Links inside this Main Nav) */}
          <div className="space-y-3.5 rounded-none border border-neutral-300 bg-background/80 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-neutral-900" />
                <span className="font-sans text-xs font-bold uppercase tracking-widest text-neutral-900">
                  Subcategories ({form.subcategories.length})
                </span>
              </div>
            </div>

            <p className="font-sans text-xs text-muted-foreground leading-relaxed">
              Add custom subcategories that appear in a dropdown when visitors interact with this
              menu item.
            </p>

            {/* Form to add or edit a subcategory */}
            <div className="space-y-2.5 rounded border border-neutral-300 bg-card p-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="font-sans text-[11px] font-bold uppercase tracking-wider text-neutral-900">
                  {editingSubIndex !== null ? (
                    <span className="inline-flex items-center gap-1.5 text-neutral-900">
                      <Pencil className="h-3 w-3" /> Editing Subcategory #{editingSubIndex + 1}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-neutral-900">
                      <Plus className="h-3 w-3" /> Add New Subcategory
                    </span>
                  )}
                </p>
                {editingSubIndex !== null && (
                  <button
                    type="button"
                    onClick={handleCancelEditSub}
                    className="text-[11px] font-semibold text-neutral-500 hover:text-black cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <TextInput
                  placeholder="Subcategory Name (e.g. Press Releases)"
                  value={newSub.label}
                  onChange={(e) => setNewSub({ ...newSub, label: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveSubcategory();
                    }
                  }}
                  className="h-9 text-xs border-neutral-300"
                />
                <TextInput
                  placeholder="Subcategory Link (e.g. /press or /about/press)"
                  value={newSub.to}
                  onChange={(e) => setNewSub({ ...newSub, to: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveSubcategory();
                    }
                  }}
                  className="h-9 text-xs border-neutral-300"
                />
              </div>

              <TextInput
                placeholder="Description / Subtitle (optional)"
                value={newSub.description}
                onChange={(e) => setNewSub({ ...newSub, description: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveSubcategory();
                  }
                }}
                className="h-9 text-xs border-neutral-300"
              />

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveSubcategory}
                  className="flex-1 rounded-none bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-semibold py-2 shadow-xs cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {editingSubIndex !== null ? "Update Subcategory" : "Add Subcategory"}
                </Button>
                {editingSubIndex !== null && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEditSub}
                    className="rounded-none border-neutral-300 text-xs text-neutral-800 hover:bg-neutral-100 cursor-pointer"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>

            {/* List of current subcategory items in this form */}
            <div className="space-y-1.5 pt-1">
              <p className="font-sans text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                Current Subcategories ({form.subcategories.length})
              </p>
              {form.subcategories.length > 0 ? (
                <div className="space-y-2">
                  {form.subcategories.map((sub, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between gap-3 border p-2.5 text-xs shadow-2xs transition-colors ${
                        editingSubIndex === index
                          ? "border-neutral-900 bg-neutral-100 ring-1 ring-neutral-900"
                          : "border-neutral-300 bg-card"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 font-bold uppercase tracking-tight text-neutral-900">
                          <CornerDownRight className="h-3.5 w-3.5 text-neutral-700" />
                          <span>{sub.label}</span>
                          <span className="font-mono text-[11px] font-normal text-neutral-600">
                            ({sub.to})
                          </span>
                        </div>
                        {sub.description && (
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            {sub.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditSubcategory(index)}
                          className="rounded p-1 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 cursor-pointer"
                          title="Edit this subcategory"
                          aria-label={`Edit subcategory ${sub.label}`}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubcategory(index)}
                          className="rounded p-1 text-neutral-600 hover:bg-red-100 hover:text-red-700 cursor-pointer"
                          title="Remove this subcategory"
                          aria-label={`Remove subcategory ${sub.label}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="border border-dashed border-neutral-300 p-3 text-center font-sans text-xs text-neutral-600">
                  No subcategories in this item yet. Use the form above to add custom subcategories.
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="flex-1 rounded-none bg-neutral-900 text-white hover:bg-neutral-800 font-semibold py-2.5 shadow-xs cursor-pointer"
              disabled={busy}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? "Save Changes & Subnavs" : "Add to Menu"}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="ghost"
                className="rounded-none border border-neutral-300 text-neutral-800 hover:bg-neutral-100"
                onClick={startCreate}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>

        {/* Right List: Navigation items and their child subnavs */}
        <div className="space-y-3">
          {loading ? (
            <p className="flex items-center gap-2 font-sans text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading menu…
            </p>
          ) : items.length === 0 ? (
            <EmptyState>
              No menu items yet — create the first one on the left. <br />
              Seed data (<code>npm run seed</code>) restores the default six.
            </EmptyState>
          ) : (
            items.map((item, index) => {
              const subCount = item.subcategories?.length ?? 0;
              const isQuickAdding = quickAddId === item._id;

              return (
                <div
                  key={item._id}
                  className={`border border-border bg-card p-4 transition-all shadow-2xs ${
                    item.visible ? "" : "opacity-60"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          aria-label={`Move ${item.label} up`}
                          className="h-6 w-7 rounded-none px-0 hover:bg-neutral-200"
                          disabled={index === 0}
                          onClick={() => void move(index, -1)}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          aria-label={`Move ${item.label} down`}
                          className="h-6 w-7 rounded-none px-0 hover:bg-neutral-200"
                          disabled={index === items.length - 1}
                          onClick={() => void move(index, 1)}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-sans text-sm font-bold uppercase tracking-tight text-neutral-900">
                            {item.label}
                          </p>
                          {subCount > 0 && (
                            <span className="inline-flex items-center gap-1 rounded bg-neutral-900 px-2 py-0.5 font-mono text-[10px] uppercase font-bold text-white shadow-2xs">
                              <Layers className="h-2.5 w-2.5" /> {subCount} Subnav
                              {subCount > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {item.to}
                          {!item.visible && " · hidden from the public menu"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-none border-neutral-300 text-neutral-800 hover:bg-neutral-100"
                        aria-label={`${item.visible ? "Hide" : "Show"} ${item.label}`}
                        onClick={() => void toggleVisibility(item)}
                      >
                        {item.visible ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}{" "}
                        {item.visible ? "Hide" : "Show"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-none border-neutral-300 text-neutral-800 hover:bg-neutral-100"
                        onClick={() => startEdit(item)}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-none bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-semibold"
                        onClick={() => {
                          setQuickAddId(isQuickAdding ? null : item._id);
                          setQuickSub(emptySubItem);
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" /> Subnav
                      </Button>
                      <ConfirmButton
                        confirmMessage={`Remove “${item.label}” from the menu? The page itself stays untouched.`}
                        onConfirm={() => remove(item)}
                      />
                    </div>
                  </div>

                  {/* Inline Quick Add Subnav panel */}
                  {isQuickAdding && (
                    <div className="mt-3 rounded border border-neutral-300 bg-neutral-50 p-3 space-y-2.5 shadow-inner">
                      <div className="flex items-center justify-between">
                        <span className="font-sans text-xs font-bold uppercase tracking-wider text-neutral-900">
                          Quick Add Subnav inside &quot;{item.label}&quot;
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuickAddId(null)}
                          className="text-xs text-neutral-500 hover:text-black font-semibold cursor-pointer"
                        >
                          ✕ Close
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <TextInput
                          placeholder="Subnav Label (e.g. News)"
                          value={quickSub.label}
                          onChange={(e) => setQuickSub({ ...quickSub, label: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void handleQuickAddSubmit(item);
                            }
                          }}
                          className="h-8 text-xs bg-white border-neutral-300"
                        />
                        <TextInput
                          placeholder="URL Link (e.g. /news)"
                          value={quickSub.to}
                          onChange={(e) => setQuickSub({ ...quickSub, to: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void handleQuickAddSubmit(item);
                            }
                          }}
                          className="h-8 text-xs bg-white border-neutral-300"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <TextInput
                          placeholder="Description (optional)"
                          value={quickSub.description}
                          onChange={(e) =>
                            setQuickSub({ ...quickSub, description: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void handleQuickAddSubmit(item);
                            }
                          }}
                          className="h-8 text-xs bg-white border-neutral-300 flex-1"
                        />
                        <Button
                          type="button"
                          size="sm"
                          disabled={quickBusy}
                          onClick={() => void handleQuickAddSubmit(item)}
                          className="rounded-none bg-neutral-900 text-white hover:bg-neutral-800 text-xs h-8 px-3 font-semibold cursor-pointer"
                        >
                          {quickBusy ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          Save Subnav
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Render child subnavs preview if any */}
                  {subCount > 0 && (
                    <div className="mt-3 border-t border-border/80 pt-3 pl-2 sm:pl-10 space-y-1.5">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
                        Subnav Dropdowns:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {item.subcategories?.map((sub, sIdx) => (
                          <div
                            key={sIdx}
                            className="inline-flex items-center gap-1.5 rounded border border-neutral-300 bg-neutral-100 px-2.5 py-1 text-xs shadow-2xs"
                          >
                            <CornerDownRight className="h-3 w-3 text-neutral-700" />
                            <span className="font-bold text-neutral-900">{sub.label}</span>
                            <span className="font-mono text-[10px] text-neutral-600">
                              ({sub.to})
                            </span>
                            <button
                              type="button"
                              onClick={() => void handleQuickRemoveSubnav(item, sIdx)}
                              className="ml-1 rounded p-0.5 text-neutral-400 hover:bg-red-100 hover:text-red-700 cursor-pointer"
                              title={`Remove subnav ${sub.label}`}
                              aria-label={`Remove subnav ${sub.label}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <p className="mt-10 font-sans text-xs text-muted-foreground">
        Any main navigation item can have subnav dropdown items. In the default model,{" "}
        <code>About</code> holds <code>News (/news)</code>, and you can add subnav links to any
        item.
      </p>
    </>
  );
}
