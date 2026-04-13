"use client";

import { useState } from "react";
import { useApp } from "@/lib/storage";
import { getCurrentMonth } from "@/lib/calculations";
import { MonthPicker } from "@/components/month-picker";
import { LeaderboardTable, OverallLeaderboard } from "@/components/leaderboard-table";
import { UserSelector } from "@/components/user-selector";

export default function LeaderboardPage() {
  const { activeUser } = useApp();
  const [month, setMonth] = useState(getCurrentMonth);

  if (!activeUser) return <UserSelector />;

  return (
    <div className="space-y-5 px-4 pt-4">
      <h1 className="text-2xl font-bold text-white">Leaderboard</h1>

      <MonthPicker month={month} onChange={setMonth} />

      <OverallLeaderboard month={month} />

      <LeaderboardTable month={month} />
    </div>
  );
}
