import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SiteHeader } from "@/components/layout/site-header";

vi.mock("next/navigation", () => ({
  usePathname: () => "/faq",
}));

describe("SiteHeader", () => {
  it("keeps cart count in the cart button and opens the compact mobile menu", async () => {
    const user = userEvent.setup();
    render(<SiteHeader cartCount={3} />);

    expect(screen.getByRole("link", { name: /korpa, 3 stavki/i })).toHaveAttribute("href", "/restorani");
    expect(screen.getByRole("link", { name: "FAQ" })).toHaveAttribute("aria-current", "page");

    await user.click(screen.getByRole("button", { name: /otvori meni/i }));

    const drawer = screen.getByRole("dialog", { name: /mobilna navigacija/i });
    expect(drawer).toBeInTheDocument();
    expect(within(drawer).getByRole("link", { name: "Restorani" })).toHaveAttribute("href", "/restorani");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: /mobilna navigacija/i })).not.toBeInTheDocument();
  });
});
