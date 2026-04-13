"use client";

import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

interface PRBadgeProps {
  type: "weight" | "volume" | "maxRepsVol";
  value?: number;
  size?: "sm" | "lg";
}

const PR_LABELS = {
  weight: "Weight PR",
  volume: "Volume PR",
  maxRepsVol: "Max Reps PR",
};

export function PRBadge({ type, value, size = "sm" }: PRBadgeProps) {
  if (size === "lg") {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 px-3 py-1">
        <Trophy className="h-4 w-4 text-yellow-400" />
        <span className="text-sm font-semibold text-yellow-400">
          {PR_LABELS[type]}
        </span>
        {value && (
          <span className="text-sm text-yellow-400/80">
            {value.toLocaleString()}
          </span>
        )}
      </div>
    );
  }

  return (
    <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 text-[10px] gap-0.5">
      <Trophy className="h-2.5 w-2.5" />
      {PR_LABELS[type]}
    </Badge>
  );
}
