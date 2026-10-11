import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3100);
const DB_PORT = 54321;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : undefined,
  },
  webServer: [
    { command: `node tests/e2e/mock-supabase.mjs ${DB_PORT}`, port: DB_PORT, reuseExistingServer: true },
    {
      command: `npm run start -- -p ${PORT}`,
      port: PORT,
      reuseExistingServer: true,
      env: {
        SUPABASE_URL: `http://localhost:${DB_PORT}`,
        SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
        ADMIN_USERNAME: "test@admin",
        ADMIN_PASSWORD: "test-admin-pass",
        ADMIN_SESSION_SECRET: "test-secret",
      },
    },
  ],
  projects: [
    { name: "desktop", testIgnore: /admin\.spec/, use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", testIgnore: /admin\.spec/, use: { ...devices["Pixel 7"] } },
    // The admin flow changes the catalogue, so it runs after the storefront tests.
    { name: "admin", testMatch: /admin\.spec/, dependencies: ["desktop", "mobile"], use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
});
