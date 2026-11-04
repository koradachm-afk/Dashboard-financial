import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Save } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders children as an accessible button", () => {
    render(<Button>บันทึก</Button>);
    expect(screen.getByRole("button", { name: "บันทึก" })).toBeInTheDocument();
  });

  it("defaults to primary md", () => {
    render(<Button>x</Button>);
    expect(screen.getByRole("button")).toHaveClass(
      "bg-primary",
      "text-on-primary",
      "h-10",
      "px-4",
      "rounded-lg",
      "text-control",
    );
  });

  it.each([
    ["secondary", "border-line"],
    ["ghost", "text-fg-2"],
    ["danger", "text-danger"],
  ] as const)("applies variant %s", (variant, cls) => {
    render(<Button variant={variant}>x</Button>);
    expect(screen.getByRole("button")).toHaveClass(cls);
  });

  it("applies each size", () => {
    const { rerender } = render(<Button size="sm">x</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-8", "text-body", "rounded-md");
    rerender(<Button size="lg">x</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-13", "text-lead", "rounded-xl");
  });

  it("className overrides size height", () => {
    render(<Button className="h-11 w-full">x</Button>);
    const b = screen.getByRole("button");
    expect(b).toHaveClass("h-11", "w-full");
    expect(b).not.toHaveClass("h-10");
  });

  it("defaults to type=button and allows type=submit", () => {
    const { rerender } = render(<Button>x</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
    rerender(<Button type="submit">x</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("passes native props", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<Button onClick={onClick}>x</Button>);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(
      <Button onClick={onClick} disabled>
        x
      </Button>,
    );
    expect(screen.getByRole("button")).toBeDisabled();
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["md", "16"],
    ["lg", "20"],
  ] as const)("renders the icon before the label at %s size", (size, px) => {
    render(
      <Button icon={Save} size={size}>
        บันทึก
      </Button>,
    );
    const b = screen.getByRole("button");
    const svg = b.querySelector("svg");
    expect(b.firstElementChild).toBe(svg);
    expect(svg).toHaveAttribute("width", px);
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});
