import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("test setup", () => {
  it("renders a component and handles a click", async () => {
    const onClick = vi.fn();
    render(
      <button type="button" onClick={onClick}>
        เข้าสู่ระบบ
      </button>,
    );

    const button = screen.getByRole("button", { name: "เข้าสู่ระบบ" });
    expect(button).toBeInTheDocument();

    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
