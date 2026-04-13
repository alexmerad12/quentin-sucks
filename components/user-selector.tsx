"use client";

import { useApp } from "@/lib/storage";
import { USER_LIST } from "@/lib/constants";
import type { UserId } from "@/types";
import { Dumbbell } from "lucide-react";

export function UserSelector() {
  const { setActiveUser } = useApp();

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center gap-10 px-6">
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <Dumbbell className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          QUENTIN SUCKS
        </h1>
        <p className="text-sm text-white/40 font-light tracking-widest uppercase">
          Who&apos;s lifting?
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        {USER_LIST.map((u, i) => (
          <button
            key={u.id}
            onClick={() => setActiveUser(u.id as UserId)}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 text-left transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg border border-primary/20">
                {u.name[0]}
              </div>
              <div>
                <div className="text-lg font-semibold text-white">{u.name}</div>
                <div className="text-xs text-white/30">
                  {u.defaultBodyWeight ? `${u.defaultBodyWeight} lbs` : "Tap to start"}
                </div>
              </div>
            </div>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function UserSwitcher() {
  const { activeUser, setActiveUser } = useApp();

  return (
    <div className="flex items-center gap-1.5">
      {USER_LIST.map((u) => {
        const active = activeUser?.id === u.id;
        return (
          <button
            key={u.id}
            onClick={() => setActiveUser(u.id as UserId)}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${
              active
                ? "bg-primary text-black shadow-[0_0_12px_rgba(74,222,128,0.3)]"
                : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
            }`}
          >
            {u.name[0]}
          </button>
        );
      })}
    </div>
  );
}
