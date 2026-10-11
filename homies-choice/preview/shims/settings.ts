import { defaultSettings, parseSettings, type StoreSettings } from "@/lib/store-settings";
import { getStore } from "./demo-store";

export { defaultSettings, parseSettings, type StoreSettings };

export async function getSettings() {
  return getStore().settings;
}
