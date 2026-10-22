import { useEffect } from "react";

type PageMeta = {
  title: string;
  description?: string;
};

function setMeta(selector: string, attribute: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attribute, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Replaces TanStack's per-route `head()` — updates document title and social meta on mount. */
export function usePageMeta({ title, description }: PageMeta) {
  useEffect(() => {
    document.title = title;
    setMeta('meta[name="description"]', "name", "description", description ?? title);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    if (description) {
      setMeta('meta[property="og:description"]', "property", "og:description", description);
    }
  }, [title, description]);
}
