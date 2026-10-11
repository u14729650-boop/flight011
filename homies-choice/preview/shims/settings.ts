import { getStore } from "./demo-store";

export async function getSettings() {
  return getStore().settings;
}
