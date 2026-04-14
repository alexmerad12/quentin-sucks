import { kv } from "@vercel/kv";
import type { AppData, UserId, User } from "@/types";

const KV_KEY = "app-data";

function getDefaultUsers(): Record<UserId, User> {
  const users = {} as Record<UserId, User>;
  const list = [
    { id: "alex" as UserId, name: "Alex", defaultBodyWeight: 200 },
    { id: "dan" as UserId, name: "Dan", defaultBodyWeight: 185 },
    { id: "quentin" as UserId, name: "Quentin", defaultBodyWeight: 0 },
  ];
  for (const u of list) {
    users[u.id] = {
      id: u.id,
      name: u.name,
      bodyWeights: u.defaultBodyWeight
        ? [{ month: "2024-11", weight: u.defaultBodyWeight }]
        : [],
    };
  }
  return users;
}

function getDefaultData(): AppData {
  return {
    version: 1,
    activeUser: null,
    users: getDefaultUsers(),
    entries: [],
    customExercises: [],
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
