import { useSyncExternalStore } from "react";

const KEY = "lumen-session";
const listeners = new Set<() => void>();

function read(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

let session: string | null = typeof window !== "undefined" ? read() : null;

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Current signed-in email (or null). Reactive across the app. */
export function useSession() {
  return useSyncExternalStore(subscribe, () => session);
}

export function login(email: string) {
  session = email;
  try {
    window.localStorage.setItem(KEY, email);
  } catch {
    /* storage unavailable — keep in-memory session */
  }
  emit();
}

export function logout() {
  session = null;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  emit();
}
