import { expect, test, type Page } from "@playwright/test";

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1440) < 1024;

test.describe("navigation & pages", () => {
  test("every internal link resolves", async ({ page, request }) => {
    const seen = new Set<string>();
    for (const start of ["/", "/shop", "/products/lattafa-khamrah", "/contact"]) {
      await page.goto(start);
      const hrefs = await page.$$eval("a[href^='/']", (as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!));
      hrefs.forEach((h) => seen.add(h.split("#")[0]));
    }
    for (const href of seen) {
      const res = await request.get(href);
      expect(res.status(), href).toBe(200);
    }
    expect(seen.size).toBeGreaterThan(20);
  });

  test("main navigation works", async ({ page }) => {
    await page.goto("/");
    if (isMobile(page)) {
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Arabic Perfumes" }).click();
    } else {
      await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Arabic Perfumes" }).click();
    }
    await expect(page).toHaveURL(/\/collections\/arabic$/);
    await expect(page.getByRole("heading", { level: 1, name: "Arabic Perfumes" })).toBeVisible();
  });

  test("no horizontal overflow", async ({ page }) => {
    for (const path of ["/", "/shop", "/watches", "/products/emporio-armani-stronger-with-you-intensely", "/contact", "/checkout"]) {
      await page.goto(path);
      // Compare with the device width: on phones, overflowing content widens the layout viewport itself.
      const width = page.viewportSize()!.width;
      const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth }));
      expect(sizes.scroll, path).toBeLessThanOrEqual(width);
      expect(sizes.inner, path).toBeLessThanOrEqual(width);
    }
  });

  test("unknown pages show the 404", async ({ page }) => {
    const res = await page.goto("/products/not-a-perfume");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "This scent trail has gone cold." })).toBeVisible();
  });

  test("SEO essentials", async ({ page, request }) => {
    await page.goto("/products/rasasi-hawas-for-him");
    await expect(page).toHaveTitle(/Rasasi Hawas for Him/);
    const ld = await page.$$eval('script[type="application/ld+json"]', (s) => s.map((x) => JSON.parse(x.textContent!)));
    expect(ld.some((d) => d["@type"] === "Product" && d.name === "Rasasi Hawas for Him")).toBe(true);
    expect(JSON.stringify(ld)).not.toMatch(/aggregateRating/);
    expect((await request.get("/sitemap.xml")).status()).toBe(200);
    expect(await (await request.get("/robots.txt")).text()).toContain("Sitemap:");
    expect((await request.get("/opengraph-image")).headers()["content-type"]).toContain("image/png");
  });
});

test.describe("search & filters", () => {
  test("header search shows live results and opens the shop", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Search perfumes" }).click();
    await page.getByLabel("Product name or brand").fill("lattafa");
    await expect(page.getByRole("dialog").getByRole("link", { name: /Khamrah/ })).toBeVisible();
    await page.getByLabel("Product name or brand").press("Enter");
    await expect(page).toHaveURL(/\/shop\?q=lattafa/);
    await expect(page.getByTestId("result-count")).toHaveText("2 fragrances");
  });

  test("filters, chips, sorting, reset and empty state", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByTestId("result-count")).toHaveText("7 fragrances");
    if (isMobile(page)) await page.getByRole("button", { name: /^Filters/ }).click();
    await page.getByRole("checkbox", { name: "Designer fragrances" }).click();
    await expect(page).toHaveURL(/origin=designer/);
    await expect(page.getByTestId("result-count")).toHaveText("1 fragrance");
    if (isMobile(page)) await page.getByRole("button", { name: "Close filters" }).click();
    await page.getByRole("button", { name: "Remove filter Designer" }).click();
    await expect(page.getByTestId("result-count")).toHaveText("7 fragrances");

    await page.getByLabel("Sort").selectOption("name-asc");
    await expect(page).toHaveURL(/sort=name-asc/);
    await expect(page.locator("main article h3").first()).toHaveText("9 PM");

    await page.getByLabel("Search by name or brand").fill("zzz");
    await expect(page.getByText("Nothing matches those filters.")).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page.getByTestId("result-count")).toHaveText("7 fragrances");
  });

  test("filter state loads from the URL", async ({ page }) => {
    await page.goto("/shop?family=aquatic");
    await expect(page.getByTestId("result-count")).toHaveText("1 fragrance");
    await expect(page.locator("main article h3")).toHaveText(["Hawas for Him"]);
  });
});

test.describe("bag & WhatsApp ordering", () => {
  test("add, change quantity and size, persist across reload, order message", async ({ page }) => {
    await page.goto("/products/emporio-armani-stronger-with-you-intensely");
    await page.locator("fieldset label").filter({ hasText: /^100 ml$/ }).click();
    await page.getByRole("group", { name: "Quantity" }).getByRole("button", { name: "Increase quantity" }).click();
    await page.getByRole("button", { name: "Add to bag", exact: true }).click();

    const drawer = page.getByRole("dialog");
    await expect(drawer.getByRole("heading", { name: /Your bag/ })).toBeVisible();
    await expect(drawer.getByRole("group", { name: /Quantity of/ })).toContainText("2");
    await drawer.getByRole("button", { name: "Increase quantity" }).click();
    await expect(page.getByRole("button", { name: /Open shopping bag, 3 items/, includeHidden: true })).toBeAttached();

    const href = await drawer.getByRole("link", { name: "Order on WhatsApp" }).getAttribute("href");
    const text = decodeURIComponent(href!.split("text=")[1]);
    expect(href).toContain("https://wa.me/919662041440");
    expect(text).toContain("Emporio Armani Stronger With You Intensely — 100 ml × 3");
    expect(text).toContain("Please confirm stock availability, delivery charges and the final payable amount.");

    await drawer.getByLabel(/Bottle size for/).selectOption({ label: "50 ml" });
    await page.reload();
    await page.getByRole("button", { name: /Open shopping bag, 3 items/ }).click();
    await expect(page.getByRole("dialog").getByLabel(/Bottle size for/)).toHaveValue("ea-swy-intensely-50");

    await page.getByRole("dialog").getByRole("link", { name: "Review order" }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await page.getByLabel("Name").fill("Riya Shah");
    await page.getByText("Preview the message").click();
    await expect(page.getByTestId("order-preview")).toContainText("Name: Riya Shah");
    await expect(page.getByTestId("order-preview")).toContainText("50 ml × 3");

    await page.getByRole("button", { name: /Remove Emporio Armani/ }).click();
    await expect(page.getByRole("heading", { name: "Your bag is empty" })).toBeVisible();
  });

  test("quick view and buy now", async ({ page }) => {
    await page.goto("/");
    const card = page.getByRole("article", { name: "Afnan 9 PM" });
    await card.getByRole("button", { name: /Quick view/ }).first().click();
    await expect(page.getByRole("dialog").getByRole("heading", { name: "9 PM" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.goto("/products/lattafa-khamrah");
    await page.getByRole("button", { name: "Buy now" }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByRole("link", { name: "Khamrah" })).toBeVisible();
    await expect(page.getByTestId("bag-subtotal")).toHaveText("To be confirmed");
  });

  test("product WhatsApp enquiry includes the selected size", async ({ page }) => {
    await page.goto("/products/emporio-armani-stronger-with-you-intensely");
    await page.locator("fieldset label").filter({ hasText: /^100 ml$/ }).click();
    const href = await page.getByRole("link", { name: "Ask about this perfume on WhatsApp" }).getAttribute("href");
    expect(decodeURIComponent(href!)).toContain("Size: 100 ml");
  });
});

test.describe("contact", () => {
  test("validates and prepares a WhatsApp enquiry", async ({ page, context }) => {
    // Don't hit the real WhatsApp site from tests.
    await context.route("https://wa.me/**", (r) => r.fulfill({ body: "whatsapp" }));
    await page.goto("/contact");
    await page.getByRole("button", { name: "Send enquiry via WhatsApp" }).click();
    await expect(page.getByText("Please enter your name.")).toBeVisible();
    await expect(page.getByLabel("Your name")).toBeFocused();

    await page.getByLabel("Your name").fill("Aman");
    await page.getByLabel("Contact number").fill("98765 43210");
    await page.getByLabel("Message").fill("Do you have Khamrah in 100 ml?");

    const popupPromise = context.waitForEvent("page");
    await page.getByRole("button", { name: "Send enquiry via WhatsApp" }).click();
    const popup = await popupPromise;
    const url = decodeURIComponent(popup.url());
    expect(url).toContain("https://wa.me/919662041440");
    expect(url).toContain("Do you have Khamrah in 100 ml?");
    expect(url).toContain("Contact number: 98765 43210");
    await expect(page.getByText("Your message is ready in WhatsApp.")).toBeVisible();
  });

  test("copy number button gives feedback", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/contact");
    await page.getByRole("button", { name: "Copy number" }).click();
    await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
  });
});
