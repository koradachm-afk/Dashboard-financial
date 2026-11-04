import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useIsMobile } from "@/components/tailgrids/core/sidebar";

let matches = false;
let listener: (() => void) | undefined;
const removeEventListener = vi.fn();

beforeEach(() => {
  matches = false;
  listener = undefined;
  removeEventListener.mockClear();
  vi.stubGlobal("matchMedia", (query: string) => ({
    get matches() {
      return matches;
    },
    media: query,
    addEventListener: (_: string, cb: () => void) => {
      listener = cb;
    },
    removeEventListener,
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useIsMobile", () => {
  it("returns false when the viewport is wide", () => {
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("returns true when the viewport is narrow", () => {
    matches = true;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("updates when the media query changes", () => {
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
    matches = true;
    act(() => listener?.());
    expect(result.current).toBe(true);
  });

  it("unsubscribes on unmount", () => {
    const { unmount } = renderHook(() => useIsMobile());
    const cb = listener;
    expect(cb).toBeDefined();
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith("change", cb);
  });

  it("uses false as the server snapshot", () => {
    matches = true;
    function Probe() {
      return <span>{String(useIsMobile())}</span>;
    }
    expect(renderToString(<Probe />)).toContain("false");
  });
});
