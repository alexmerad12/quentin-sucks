"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, CalendarDays, Trophy, Footprints } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/storage";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/log", label: "Log", icon: Dumbbell },
  { href: "/cardio", label: "Cardio", icon: Footprints },
  { href: "/history", label: "History", icon: CalendarDays },
  { href: "/leaderboard", label: "Board", icon: Trophy },
];

export function NavBar() {
  const pathname = usePathname();
  const { activeUser } = useApp();

  // Hide nav when no user selected (user selection screen)
  if (!activeUser) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-black/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium tracking-wide uppercase transition-all duration-200",
                active
                  ? "text-primary"
                  : "text-white/50 hover:text-white/70"
              )}
            >
              <tab.icon className={cn(
                "h-5 w-5",
                active && "drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]"
              )} strokeWidth={active ? 2.5 : 1.5} />
              {tab.label}
              {active && (
                <span className="absolute -top-px left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
