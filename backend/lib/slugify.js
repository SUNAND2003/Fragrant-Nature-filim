export function slugify(input) {
  const slug = String(input ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");
  return slug || "untitled";
}

// Resolves conflicts as `base-2`, `base-3`, ... instead of failing with a duplicate-key error.
// `isTaken` is an async predicate: (candidateSlug) => boolean.
export async function uniqueSlug(input, isTaken) {
  const base = slugify(input);
  let slug = base;
  for (let n = 2; await isTaken(slug); n += 1) {
    slug = `${base}-${n}`;
  }
  return slug;
}
