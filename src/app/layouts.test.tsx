import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdminLayout from "@/app/(admin)/layout";
import AuthLayout from "@/app/(auth)/layout";
import PayLayout from "@/app/(customer)/pay/layout";
import KioskLayout from "@/app/kiosk/layout";
import RootLayout from "@/app/layout";

vi.mock("@/components/sidebarmenu", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar">{children}</div>
  ),
}));

const props = { params: Promise.resolve({}) };

describe("root layout", () => {
  it("renders <html lang='th'> with a <body> around children", () => {
    const tree = RootLayout({ children: <p>page</p>, ...props });
    expect(tree.type).toBe("html");
    expect(tree.props.lang).toBe("th");
    expect(tree.props.children.type).toBe("body");
  });
});

describe.each([
  ["auth", AuthLayout],
  ["pay", PayLayout],
  ["kiosk", KioskLayout],
])("%s layout", (_name, Layout) => {
  it("renders a light wrapper, not html/body", () => {
    const { container } = render(
      <Layout {...props}>
        <p>page</p>
      </Layout>,
    );
    expect(container.querySelector("html, body")).toBeNull();
    const wrapper = container.firstElementChild!;
    expect(wrapper).toHaveAttribute("data-theme", "light");
    expect(wrapper).toHaveClass("flex", "min-h-0", "flex-1", "flex-col", "overflow-y-auto");
    expect(wrapper).toHaveTextContent("page");
  });
});

describe("admin layout", () => {
  it("wraps children in the sidebar and renders no html/body", () => {
    const { container, getByTestId } = render(
      <AdminLayout {...props}>
        <p>page</p>
      </AdminLayout>,
    );
    expect(container.querySelector("html, body")).toBeNull();
    expect(getByTestId("sidebar")).toHaveTextContent("page");
    expect(container.firstElementChild).toBe(getByTestId("sidebar"));
  });
});
