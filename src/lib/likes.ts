import { useEffect, useState } from "react";

const KEY = "fn-likes";

// Module-level store so the header indicator and the hero button always show
// the same list — each `useLikes()` subscriber is notified on every change.
function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

let likes: string[] = read();
const listeners = new Set<(next: string[]) => void>();

function commit(next: string[]) {
  likes = next;
  localStorage.setItem(KEY, JSON.stringify(likes));
  listeners.forEach((fn) => fn(likes));
}

/** Liked film slugs, persisted to localStorage and shared across components. */
export function useLikes() {
  const [value, setValue] = useState<string[]>(likes);

  useEffect(() => {
    listeners.add(setValue);
    return () => {
      listeners.delete(setValue);
    };
  }, []);

  const toggle = (slug: string) =>
    commit(likes.includes(slug) ? likes.filter((s) => s !== slug) : [...likes, slug]);

  const clear = () => commit([]);

  return { likes: value, toggle, clear };
}
