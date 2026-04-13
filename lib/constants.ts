import type { UserId, User } from "@/types";

export const APP_NAME = "Quentin Sucks";

export const USER_LIST: { id: UserId; name: string; defaultBodyWeight: number }[] = [
  { id: "alex", name: "Alex", defaultBodyWeight: 200 },
  { id: "dan", name: "Dan", defaultBodyWeight: 185 },
  { id: "quentin", name: "Quentin", defaultBodyWeight: 0 },
];

export function getDefaultUsers(): Record<UserId, User> {
  const users = {} as Record<UserId, User>;
  for (const u of USER_LIST) {
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

export const WEEK_OPTIONS = [1, 2, 3, 4, 5] as const;
