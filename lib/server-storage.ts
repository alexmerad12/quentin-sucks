import { kv } from "@vercel/kv";
import type { AppData } from "@/types";
import { getDefaultUsers } from "./constants";

const KV_KEY = "app-data";

function getDefaultData(): AppData {
  return {
    version: 1,
    activeUser: null,
    users: getDefaultUsers(),
    entries: [],
    customExercises: [],
    cardioEntries: [],
  };
}

export async function readServerData(): Promise<AppData> {
  try {
    const data = await kv.get<AppData>(KV_KEY);
    if (!data) {
      const defaultData = getDefaultData();
      await kv.set(KV_KEY, defaultData);
      return defaultData;
    }
    // Backward compat: old KV data may not have cardioEntries
    if (!data.cardioEntries) data.cardioEntries = [];
    return data;
  } catch {
    return getDefaultData();
  }
}

export async function writeServerData(data: AppData): Promise<void> {
  try {
    await kv.set(KV_KEY, data);
  } catch (err) {
    console.error("Failed to write to KV:", err);
  }
}
