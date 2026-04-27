import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import SectionPage from "./page";

describe("SectionPage", () => {
  it("keeps desktop and mobile filter submissions independent", async () => {
    const user = userEvent.setup();

    render(
      await SectionPage({
        params: Promise.resolve({ id: "snacks-and-appetizers" }),
        searchParams: Promise.resolve({ dietary: "vegetarian", maxTime: "45", heat: "1" })
      })
    );

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
  });
});
