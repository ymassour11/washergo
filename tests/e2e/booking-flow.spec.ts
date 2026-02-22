import { test, expect } from "@playwright/test";

test.describe("Booking flow", () => {
  test("homepage redirects to /book", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/book/);
  });

  test("shows Book Now button on /book", async ({ page }) => {
    await page.goto("/book");
    await expect(page.getByRole("button", { name: "Book Now" })).toBeVisible();
  });

  test("creates booking and reaches step 1", async ({ page }) => {
    await page.goto("/book");
    await page.getByRole("button", { name: "Book Now" }).click();

    // Should redirect to /book/[uuid]
    await expect(page).toHaveURL(/\/book\/[a-f0-9-]+/);

    // Step 1 content should be visible
    await expect(page.getByText("Check Your Service Area")).toBeVisible();
  });
});

test.describe("Admin", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/admin/bookings");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("shows login form", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("heading", { name: "Admin Login" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });
});
