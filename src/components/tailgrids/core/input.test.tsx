import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { User } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { Input } from "./input";

describe("Input", () => {
  it("renders a textbox inside a styled wrapper", () => {
    render(<Input />);
    const wrapper = screen.getByRole("textbox").parentElement;
    expect(wrapper).toHaveClass(
      "border-line",
      "bg-surface",
      "h-9",
      "rounded-md",
      "text-control",
    );
  });

  it("applies lg size", () => {
    render(<Input size="lg" />);
    expect(screen.getByRole("textbox").parentElement).toHaveClass(
      "h-14",
      "rounded-xl",
      "text-h3",
    );
  });

  it("className overrides size height", () => {
    render(<Input className="h-11" />);
    const wrapper = screen.getByRole("textbox").parentElement;
    expect(wrapper).toHaveClass("h-11");
    expect(wrapper).not.toHaveClass("h-9");
  });

  it("error marks the input aria-invalid", () => {
    const { rerender } = render(<Input error />);
    const input = screen.getByRole("textbox");
    expect(input.parentElement).toHaveClass("border-danger", "ring-danger");
    expect(input).toHaveAttribute("aria-invalid", "true");
    rerender(<Input />);
    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid");
  });

  it("keeps the error colors while focused", () => {
    render(<Input error />);
    expect(screen.getByRole("textbox").parentElement).toHaveClass(
      "focus-within:border-danger",
      "focus-within:ring-danger",
    );
  });

  it("renders a leading icon at 16px (md) / 20px (lg)", () => {
    const { container, rerender } = render(<Input icon={User} />);
    let svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "16");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(
      svg!.compareDocumentPosition(screen.getByRole("textbox")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    rerender(<Input icon={User} size="lg" />);
    svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "20");
  });

  it("renders trailing content after the input", () => {
    render(
      <Input trailing={<button type="button" aria-label="แสดงรหัสผ่าน" />} />,
    );
    const button = screen.getByRole("button", { name: "แสดงรหัสผ่าน" });
    expect(
      screen.getByRole("textbox").compareDocumentPosition(button) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("passes native props", async () => {
    const onChange = vi.fn();
    render(
      <Input
        type="password"
        autoComplete="current-password"
        id="pw"
        name="password"
        value=""
        onChange={onChange}
      />,
    );
    const input = document.getElementById("pw") as HTMLInputElement;
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("autocomplete", "current-password");
    expect(input).toHaveAttribute("name", "password");
    await userEvent.type(input, "a");
    expect(onChange).toHaveBeenCalled();
  });

  it("forwards ref to the input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("disabled reaches the input and dims the wrapper", () => {
    render(<Input disabled />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
    expect(input.parentElement).toHaveClass("has-[:disabled]:opacity-50");
  });
});
