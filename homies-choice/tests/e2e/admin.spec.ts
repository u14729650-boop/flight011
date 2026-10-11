import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

async function signIn(page: Page) {
  await page.goto("/hc-admin");
  await expect(page).toHaveURL(/\/hc-admin\/login$/);
  await page.getByLabel("Username").fill("Test@Admin");
  await page.getByLabel("Password").fill("test-admin-pass");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Good to see you." })).toBeVisible();
}

test("admin is hidden and protected", async ({ page, request }) => {
  // Not linked from the shop, not in robots or the sitemap.
  await page.goto("/");
  expect(await page.locator('a[href*="hc-admin"]').count()).toBe(0);
  expect(await (await request.get("/robots.txt")).text()).not.toContain("hc-admin");
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain("hc-admin");

  // Protected pages and APIs.
  expect((await request.get("/api/admin/products")).status()).toBe(401);
  const res = await request.get("/hc-admin/products", { maxRedirects: 0 });
  expect(res.status()).toBe(307);
  expect((await request.get("/hc-admin/login")).headers()["x-robots-tag"]).toContain("noindex");

  await page.goto("/hc-admin/login");
  await page.getByLabel("Username").fill("test@admin");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("#admin-password-error")).toHaveText("That username or password isn't right.");
  // The right password with the wrong username is also refused.
  const res2 = await page.request.post("/api/admin/login", { data: { username: "someone@else", password: "test-admin-pass" } });
  expect(res2.status()).toBe(401);
});

test("import, edit a price, add and remove a watch", async ({ page }) => {
  await signIn(page);

  await page.getByRole("button", { name: "Import starter catalogue" }).click();
  await expect(page.getByText("Imported 7 products.")).toBeVisible();

  // Set a price.
  await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Products" }).click();
  await page.getByRole("link", { name: "Edit Lattafa Asad Bourbon" }).click();
  await page.getByLabel("Price (₹)").fill("2450");
  await page.getByRole("button", { name: "Save product" }).click();
  await expect(page.getByText("Saved. The shop is updated.")).toBeVisible();

  await page.goto("/products/lattafa-asad-bourbon");
  await expect(page.locator("main").getByText("₹2,450").first()).toBeVisible();

  // Add a watch.
  await page.goto("/hc-admin/products/new?category=watch");
  await page.getByLabel("Brand").fill("Testmaker");
  await page.getByLabel("Model name").fill("Meridian 40");
  await page.getByLabel("Description").fill("A clean three-hand watch for everyday wear.");
  await page.getByLabel("Option", { exact: true }).fill("Green dial · Steel");
  await page.getByLabel("Price (₹)").fill("8999");
  await page.getByLabel("Stock").selectOption("in_stock");
  await page.getByRole("button", { name: "Save product" }).click();
  await expect(page.getByText("Saved. The shop is updated.")).toBeVisible();
  await expect(page).toHaveURL(/\/hc-admin\/products\/testmaker-meridian-40$/);

  await page.goto("/watches");
  await expect(page.getByTestId("result-count")).toHaveText("1 watch");
  await page.getByRole("link", { name: "Meridian 40" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Meridian 40" })).toBeVisible();
  await expect(page.getByText("Green dial · Steel").first()).toBeVisible();
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  const href = await page.getByRole("dialog").getByRole("link", { name: "Order on WhatsApp" }).getAttribute("href");
  expect(decodeURIComponent(href!)).toContain("Testmaker Meridian 40 — Green dial · Steel × 1 — ₹8,999");

  // Delete it again.
  await page.goto("/hc-admin/products/testmaker-meridian-40");
  await page.getByRole("button", { name: "Delete product…" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page).toHaveURL(/\/hc-admin\/products$/);
  expect((await page.request.get("/products/testmaker-meridian-40")).status()).toBe(404);
});

test("enquiries and announcement settings", async ({ page, context }) => {
  await context.route("https://wa.me/**", (r) => r.fulfill({ body: "whatsapp" }));
  await page.goto("/contact");
  await page.getByLabel("Your name").fill("Riya Test");
  await page.getByLabel("Contact number").fill("98765 43210");
  await page.getByLabel("Message").fill("Do you have Rasasi Hawas in stock?");
  const popup = context.waitForEvent("page");
  await page.getByRole("button", { name: "Send enquiry via WhatsApp" }).click();
  await popup;

  await signIn(page);
  await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Enquiries" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Enquiries" })).toBeVisible();
  await expect(page.getByText("Do you have Rasasi Hawas in stock?")).toBeVisible();
  // Earlier storefront tests also sent enquiries; reply to all of them.
  const markButtons = page.getByRole("button", { name: "Mark as replied" });
  while ((await markButtons.count()) > 0) {
    const before = await markButtons.count();
    await markButtons.first().click();
    await expect(markButtons).toHaveCount(before - 1);
  }
  await expect(page.getByText("You're all caught up.")).toBeVisible();

  await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Store settings" }).click();
  await page.getByLabel(/^Text/).fill("Now open in Paldi — visit us this weekend");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Saved. The announcement bar is updated.")).toBeVisible();
  await page.goto("/");
  await expect(page.getByText("Now open in Paldi — visit us this weekend")).toBeVisible();

  await page.goto("/hc-admin");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/hc-admin\/login$/);
  expect((await page.request.get("/api/admin/products")).status()).toBe(401);
});
