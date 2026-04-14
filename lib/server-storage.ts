import fs from "fs";
import path from "path";
import type { AppData, UserId, User } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "app-data.json");

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

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readServerData(): AppData {
  ensureDataDir();
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const defaultData = getDefaultData();
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as AppData;
  } catch {
    return getDefaultData();
  }
}

export function writeServerData(data: AppData) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
