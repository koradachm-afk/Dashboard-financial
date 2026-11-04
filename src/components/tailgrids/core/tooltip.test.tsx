import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

describe("Tooltip", () => {
  it("shows the tooltip on hover", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip>
        <TooltipTrigger>เปิด</TooltipTrigger>
        <TooltipContent>คำอธิบาย</TooltipContent>
      </Tooltip>
    );
    await user.hover(screen.getByRole("button", { name: "เปิด" }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("คำอธิบาย");
  });

  it("shows the tooltip on keyboard focus", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip>
        <TooltipTrigger>เปิด</TooltipTrigger>
        <TooltipContent>คำอธิบาย</TooltipContent>
      </Tooltip>
    );
    await user.tab();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("คำอธิบาย");
  });

  it("renders the arrow inside the open tooltip", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip>
        <TooltipTrigger>เปิด</TooltipTrigger>
        <TooltipContent>คำอธิบาย</TooltipContent>
      </Tooltip>
    );
    await user.hover(screen.getByRole("button", { name: "เปิด" }));
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip.querySelector("svg")).not.toBeNull();
  });

  it("hides the tooltip on Escape", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip>
        <TooltipTrigger>เปิด</TooltipTrigger>
        <TooltipContent>คำอธิบาย</TooltipContent>
      </Tooltip>
    );
    await user.tab();
    await screen.findByRole("tooltip");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("supports asChild", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip>
        <TooltipTrigger asChild>
          <a href="#x">ลิงก์</a>
        </TooltipTrigger>
        <TooltipContent>คำอธิบาย</TooltipContent>
      </Tooltip>
    );
    expect(screen.queryByRole("button")).toBeNull();
    await user.hover(screen.getByRole("link", { name: "ลิงก์" }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("คำอธิบาย");
  });
});
