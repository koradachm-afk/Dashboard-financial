export const STORE_PREFIX = "autoparking:v1:";

/** Values are shallow-frozen and immutable: build a new object or array before calling `set`. */
export type Store<T> = {
  get(): T;
  set(next: T): void;
  subscribe(onChange: () => void): () => void;
  getServerSnapshot(): T;
  reset(): void;
};

const registry = new Set<Store<unknown>>();
const hasWindow = () => typeof window !== "undefined";

/** Create a localStorage-backed store for one domain, with seed fallback and an in-memory fallback. */
export function createStore<T>(options: {
  domain: string;
  seed: T;
  validate: (value: unknown) => value is T;
}): Store<T> {
  const { validate } = options;
  const seed = Object.freeze(options.seed);
  const key = STORE_PREFIX + options.domain;
  const listeners = new Set<() => void>();
  let cache: T | undefined;
  let hasCache = false;
  let memory: T = seed; // last known value, used when storage throws
  let lastRaw: string | null | undefined; // last raw string read from or written to storage

  const write = (value: T) => {
    memory = value;
    try {
      const raw = JSON.stringify(value);
      localStorage.setItem(key, raw);
      lastRaw = raw;
    } catch {
      // storage unavailable: memory keeps the value
    }
  };

  const read = (): T => {
    try {
      const raw = localStorage.getItem(key);
      lastRaw = raw;
      if (raw !== null) {
        const parsed: unknown = JSON.parse(raw);
        if (validate(parsed)) {
          memory = Object.freeze(parsed);
          return memory;
        }
      }
    } catch (error) {
      // JSON.parse errors fall through to the seed; storage errors use memory
      if (!(error instanceof SyntaxError)) return memory;
    }
    write(seed);
    return seed;
  };

  const notify = () => listeners.forEach((fn) => fn());

  const onStorage = (event: StorageEvent) => {
    try {
      if (event.storageArea && event.storageArea !== localStorage) return;
    } catch {
      // storage blocked: fall through to the key check
    }
    if (event.key !== key && event.key !== null) return;
    hasCache = false;
    cache = undefined;
    notify();
  };

  const store: Store<T> = {
    get() {
      if (!hasWindow()) return seed;
      if (!hasCache) {
        cache = read();
        hasCache = true;
      }
      return cache as T;
    },
    set(next) {
      if (!validate(next) || !hasWindow()) return;
      Object.freeze(next);
      write(next);
      cache = next;
      hasCache = true;
      notify();
    },
    subscribe(onChange) {
      if (hasWindow() && listeners.size === 0) {
        // storage may have changed while nobody was listening
        try {
          if (hasCache && lastRaw !== undefined && localStorage.getItem(key) !== lastRaw) {
            hasCache = false;
            cache = undefined;
          }
        } catch {
          // keep the cache
        }
        window.addEventListener("storage", onStorage);
      }
      listeners.add(onChange);
      return () => {
        listeners.delete(onChange);
        if (hasWindow() && listeners.size === 0) {
          window.removeEventListener("storage", onStorage);
        }
      };
    },
    getServerSnapshot: () => seed,
    reset() {
      if (!hasWindow()) return;
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
      write(seed);
      cache = seed;
      hasCache = true;
      notify();
    },
  };

  registry.add(store as Store<unknown>);
  return store;
}

/** Remove every autoparking key from localStorage and reset all created stores to their seeds. */
export function resetStore(): void {
  if (hasWindow()) {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(STORE_PREFIX)) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore: stores still reset below
    }
  }
  registry.forEach((s) => s.reset());
}
