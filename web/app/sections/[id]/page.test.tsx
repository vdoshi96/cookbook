import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { getAllSections, getFrontMatter } from "@/lib/data";
import SectionPage, { generateMetadata, generateStaticParams } from "./page";

describe("SectionPage", () => {
  it("keeps desktop and mobile filter submissions independent", async () => {
    const user = userEvent.setup();

    window.history.pushState({}, "", "/sections/snacks-and-appetizers?dietary=vegetarian&maxTime=45&heat=1");

    render(
      await SectionPage({
        params: Promise.resolve({ id: "snacks-and-appetizers" })
      })
    );

    await waitFor(() => expect(screen.getByRole("spinbutton", { name: "Maximum total minutes" })).toHaveValue(45));

    const desktopForm = screen.getByRole("form", { name: "Desktop recipe filters" });

    await user.click(screen.getByRole("button", { name: "Filter" }));

    const dialog = await screen.findByRole("dialog", { name: "Recipe filters" });
    const mobileForm = within(dialog).getByRole("form", { name: "Mobile recipe filters" });

    expect(desktopForm).not.toContainElement(mobileForm);

    await user.click(within(mobileForm).getByLabelText("Vegetarian"));

    const mobileData = new FormData(mobileForm as HTMLFormElement);
    const desktopData = new FormData(desktopForm as HTMLFormElement);

    expect(mobileData.getAll("dietary")).toEqual([]);
    expect(mobileData.get("maxTime")).toBe("45");
    expect(mobileData.get("heat")).toBe("1");
    expect(desktopData.getAll("dietary")).toEqual(["vegetarian"]);

    window.history.pushState({}, "", "/");
  });

  it("renders a section hero image and never exposes page ranges", async () => {
    render(
      await SectionPage({
        params: Promise.resolve({ id: "snacks-and-appetizers" })
      })
    );

    const hero = document.querySelector(".fullscreen-hero.listing-fullscreen-hero");

    expect(hero).not.toBeNull();
    expect(within(hero as HTMLElement).getByRole("img", { name: /Snacks and Appetizers/i }).tagName).toBe("IMG");
    expect(screen.queryByText("95")).not.toBeInTheDocument();
    expect(screen.queryByText("227")).not.toBeInTheDocument();
  });

  it("renders Introduction as long-form prose without recipe filters or counts", async () => {
    render(
      await SectionPage({
        params: Promise.resolve({ id: "introduction" })
      })
    );

    const frontMatter = getFrontMatter();

    expect(screen.getByRole("heading", { level: 1, name: frontMatter.introduction.title })).toBeInTheDocument();
    expect(screen.getByText(frontMatter.introduction.markdown)).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "Desktop recipe filters" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Filter" })).not.toBeInTheDocument();
    expect(screen.queryByText(/0 recipes/i)).not.toBeInTheDocument();
  });

  it("statically generates real section pages without Guest Chefs", async () => {
    const staticParams = generateStaticParams();

    expect(staticParams).toHaveLength(getAllSections().length);
    expect(staticParams).toContainEqual({ id: "snacks-and-appetizers" });
    expect(staticParams).toContainEqual({ id: "introduction" });
    expect(staticParams).not.toContainEqual({ id: "guest-chefs" });
    await expect(generateMetadata({ params: Promise.resolve({ id: "snacks-and-appetizers" }) })).resolves.toEqual({
      title: "Snacks and Appetizers"
    });
  });
});
