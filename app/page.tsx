"use client";

import { useApp } from "@/lib/storage";
import { UserSelector } from "@/components/user-selector";
import { StatsCard } from "@/components/stats-card";
import { ActivityFeed } from "@/components/activity-feed";
import { UserSwitcher } from "@/components/user-selector";
import Link from "next/link";
import { Dumbbell, Database } from "lucide-react";
import { toast } from "sonner";

export default function HomePage() {
  const { data, activeUser, loadSeedData } = useApp();

  if (!activeUser) return <UserSelector />;

  return (
    <div className="space-y-6 px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-white/30 tracking-widest uppercase">
            Quentin Sucks
          </p>
          <h1 className="text-2xl font-bold text-white mt-0.5">
            Hey, {activeUser.name}
          </h1>
        </div>
        <UserSwitcher />
      </div>

      {/* Big CTA */}
      <Link href="/log" className="block">
        <div className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 transition-all duration-300 hover:border-primary/40 active:scale-[0.98]">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Dumbbell className="h-7 w-7" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">Log Workout</div>
              <div className="text-sm text-white/40">
                Tap to start logging or talk to AI
              </div>
            </div>
          </div>
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </div>
      </Link>

      <StatsCard />

      <ActivityFeed />

      {/* Seed data button - only when empty */}
      {data.entries.length === 0 && (
        <button
          onClick={() => {
            loadSeedData();
            toast.success("Demo data loaded!");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 px-4 py-3 text-xs text-white/30 transition-colors hover:border-white/20 hover:text-white/50"
        >
          <Database className="h-3.5 w-3.5" />
          Load demo data
        </button>
      )}
    </div>
  );
}
