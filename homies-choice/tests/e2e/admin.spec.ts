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
  await expect(page.getByText("Saved. Your details are updated across the website.")).toBeVisible();
  await page.goto("/");
  // Phones get a scrolling copy of the line, so match the copy shown at this width.
  await expect(page.getByText("Now open in Paldi — visit us this weekend").filter({ visible: true })).toBeVisible();

  await page.goto("/hc-admin");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/hc-admin\/login$/);
  expect((await page.request.get("/api/admin/products")).status()).toBe(401);
});

test("banners: edit, hide and reorder", async ({ page }) => {
  await signIn(page);
  await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Banners" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Banners" })).toBeVisible();
  await expect(page.getByText("Rich, long-lasting Arabic perfumes", { exact: true })).toBeVisible();

  // Edit the first home banner's headline.
  await page.getByRole("link", { name: "Edit “Rich, long-lasting Arabic perfumes”" }).click();
  await page.getByLabel("Headline").fill("The festive Arabic edit");
  await page.getByRole("button", { name: "Save banner" }).click();
  await expect(page.getByText("Saved. The website is updated.")).toBeVisible();

  await page.goto("/");
  const carousel = page.getByRole("region", { name: "Featured at Homies Choice" });
  await expect(carousel.getByRole("heading", { name: "The festive Arabic edit" })).toBeAttached();

  // Reorder: move the watches banner first, then hide it.
  await page.goto("/hc-admin/banners");
  await page.getByRole("button", { name: "Move “Watches, chosen with the same care” earlier" }).click();
  await expect(page.locator("li").filter({ hasText: "Watches, chosen with the same care" }).getByRole("button", { name: /earlier/ })).toBeDisabled();
  await page.getByRole("checkbox", { name: /Show “Watches, chosen with the same care”/ }).uncheck();
  await expect(page.locator("li").filter({ hasText: "Watches, chosen with the same care" }).getByText("Off")).toBeVisible();

  await page.goto("/");
  await expect(carousel.getByRole("heading", { name: "Watches, chosen with the same care" })).toHaveCount(0);
  await expect(carousel.getByRole("heading", { name: "The festive Arabic edit" })).toBeAttached();
});


test("payments: cash on delivery with a token, UPI, and the order in the dashboard", async ({ page, browser }) => {
  await signIn(page);
  await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Payments" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Payments" })).toBeVisible();

  // UPI can't be switched on without a valid UPI ID.
  await expect(page.getByRole("switch", { name: /Offer UPI at checkout/ })).toBeDisabled();
  await page.getByText("Ask for an advance token").click();
  await page.getByLabel(/Token amount/).fill("0");
  await page.getByRole("button", { name: "Save payments" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Token amount" })).toContainText("set an amount above ₹0");

  await page.getByLabel(/Token amount/).fill("200");
  await page.getByLabel(/Your UPI ID/).fill("example@upi");
  await page.getByText("Offer UPI at checkout").click();
  await expect(page.getByRole("img", { name: "Test UPI QR for example@upi" })).toBeVisible();
  await page.getByRole("button", { name: "Save payments" }).click();
  await expect(page.getByText("Saved. Checkout now shows these payment options.")).toBeVisible();

  // A shopper checks out.
  const shopper = await browser.newPage();
  await shopper.context().route("https://wa.me/**", (route) => route.fulfill({ status: 200, body: "ok" }));
  await shopper.goto("/products/lattafa-khamrah");
  await shopper.getByRole("button", { name: "Buy now" }).click();
  await expect(shopper).toHaveURL(/\/checkout$/);
  await expect(shopper.getByRole("radio", { name: "Cash on delivery" })).toBeChecked();
  await expect(shopper.getByRole("radio", { name: "Cash on delivery" })).toHaveAccessibleDescription(/₹200 advance token/);
  await expect(shopper.getByTestId("upi-pay")).toContainText("Advance token to confirm your order");
  await expect(shopper.getByTestId("upi-app-link")).toHaveAttribute("href", /^upi:\/\/pay\?pa=example%40upi&pn=HOMIES%20CHOICE&am=200\.00&cu=INR&tn=Token%20HC-/);
  await expect(shopper.getByTestId("due-summary")).toContainText("₹200");

  await shopper.getByRole("radio", { name: "UPI" }).check();
  await expect(shopper.getByTestId("upi-id")).toHaveText("example@upi");
  await shopper.getByLabel(/UPI transaction ID/).fill("412345678901");
  await shopper.getByLabel("Name").fill("Riya Shah");
  const ref = (await shopper.getByTestId("order-ref").textContent())!.trim();
  await shopper.getByText("Preview the message").click();
  const preview = shopper.getByTestId("order-preview");
  await expect(preview).toContainText(`ref ${ref}`);
  await expect(preview).toContainText("Payment: UPI");
  await expect(preview).toContainText("UPI transaction ID 412345678901");
  const popup = shopper.waitForEvent("popup");
  await shopper.getByRole("link", { name: "Place order on WhatsApp" }).click();
  expect((await popup).url()).toContain("https://wa.me/919662041440?text=");
  await shopper.close();

  // It shows up under Orders, where the status can be changed.
  await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Orders" }).click();
  const row = page.getByTestId("order-row").filter({ hasText: ref });
  await expect(row).toContainText("Lattafa Khamrah");
  await expect(row).toContainText("Riya Shah");
  await expect(row).toContainText("412345678901");
  await row.getByLabel(`Status of ${ref}`).selectOption("paid");
  await page.reload();
  await page.getByRole("tab", { name: /^Paid/ }).click();
  await expect(page.getByTestId("order-row").filter({ hasText: ref })).toBeVisible();

  // Switch UPI back off so the storefront tests see the defaults on a re-run.
  await page.goto("/hc-admin/payments");
  await page.getByText("Offer UPI at checkout").click();
  await page.getByText("Ask for an advance token").click();
  await page.getByRole("button", { name: "Save payments" }).click();
  await expect(page.getByText("Saved. Checkout now shows these payment options.")).toBeVisible();
});

test("home page and store details are controlled from the dashboard", async ({ page }) => {
  await signIn(page);
  await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Home page" }).click();
  await page.getByLabel("Highlighted word").fill("favourite");
  await page.getByText("Rose", { exact: true }).click();
  await page.getByText("Brand names", { exact: true }).click();
  await page.getByRole("button", { name: "Save home page" }).click();
  await expect(page.getByText("Saved. The home page is updated.")).toBeVisible();

  await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Store settings" }).click();
  await page.getByLabel(/WhatsApp number/).fill("+91 98765 43210");
  await page.getByLabel(/Opening hours/).fill("Open daily, 11 am – 10 pm");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Saved. Your details are updated across the website.")).toBeVisible();

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Find your favourite scent.");
  await expect(page.getByRole("img", { name: /rose Homies Choice perfume bottle/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Iconic names/ })).toHaveCount(0);
  await expect(page.locator("footer")).toContainText("Open daily, 11 am – 10 pm");
  await expect(page.locator('footer a[href^="https://wa.me/919876543210"]').first()).toBeAttached();

  // Every page of the site is reachable from the overview.
  await page.goto("/hc-admin");
  await expect(page.getByRole("link", { name: "Open Checkout & payments in a new tab" })).toHaveAttribute("href", "/checkout");
  await expect(page.getByRole("link", { name: "Edit Home page" })).toHaveAttribute("href", "/hc-admin/home");

  // Put things back.
  await page.goto("/hc-admin/home");
  await page.getByLabel("Highlighted word").fill("signature");
  await page.getByText("Emerald", { exact: true }).click();
  await page.getByText("Brand names", { exact: true }).click();
  await page.getByRole("button", { name: "Save home page" }).click();
  await expect(page.getByText("Saved. The home page is updated.")).toBeVisible();
  await page.goto("/hc-admin/settings");
  await page.getByLabel(/WhatsApp number/).fill("+91 96620 41440");
  await page.getByLabel(/Opening hours/).fill("");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Saved. Your details are updated across the website.")).toBeVisible();
});
