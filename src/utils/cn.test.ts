import { describe, expect, it } from "vitest";
import { cn } from "@/utils/cn";

describe("cn", () => {
  it("joins classes and drops falsy values", () => {
    expect(cn("flex", false && "hidden", undefined, "gap-2")).toBe("flex gap-2");
  });
  it("lets the later conflicting class win", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
