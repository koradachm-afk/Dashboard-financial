import { describe, expect, it } from "vitest";
import { cn } from "@/utils/cn";

describe("cn", () => {
  it("joins classes and drops falsy values", () => {
    expect(cn("flex", false, undefined, "gap-2")).toBe("flex gap-2");
  });
  it("lets the later conflicting class win", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
  it("keeps a project font size next to a color", () => {
    expect(cn("text-body", "text-fg")).toBe("text-body text-fg");
  });
  it("lets the later project font size win", () => {
    expect(cn("text-body", "text-label")).toBe("text-label");
  });
  it("lets the later project radius win", () => {
    expect(cn("rounded-md", "rounded-modal")).toBe("rounded-modal");
  });
  it("keeps kiosk sizes as font sizes", () => {
    expect(cn("text-kiosk-lg", "text-on-primary")).toBe("text-kiosk-lg text-on-primary");
  });
});
