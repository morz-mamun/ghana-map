"use client";

import { Droplet, HelpCircle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  ongoing: number;
  needed: number;
  completed: number;
  peopleInNeed: number;
}

interface RegionStatsPopupProps {
  name: string;
  stats?: Stats;
  className?: string;
}

export function RegionStatsPopup({ name, stats, className }: RegionStatsPopupProps) {
  return (
    <div className={cn("min-w-[220px] p-1", className)}>
      <h3 className={cn(
        "text-lg font-bold text-foreground",
        stats ? "mb-3 border-b pb-1" : "mb-0"
      )}>
        {name}
      </h3>
      
      {stats && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-500">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Ongoing</span>
            </div>
            <span className="text-sm font-bold">{stats.ongoing}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-500">
              <HelpCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Needed</span>
            </div>
            <span className="text-sm font-bold">{stats.needed}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Completed</span>
            </div>
            <span className="text-sm font-bold">{stats.completed}</span>
          </div>

          <div className="mt-3 flex items-center justify-between border-t pt-2 border-dashed">
            <div className="flex items-center gap-2 text-rose-500">
              <Droplet className="h-4 w-4" />
              <span className="text-sm font-medium">People in Need</span>
            </div>
            <span className="text-sm font-bold">{stats.peopleInNeed.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
