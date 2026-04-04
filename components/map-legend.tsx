"use client";

import { CheckCircle2, Clock, HelpCircle } from "lucide-react";

export function MapLegend() {
  return (
    <div className="absolute bottom-10 right-16 z-20 flex flex-col gap-2 rounded-lg border bg-background/80 p-3 shadow-lg backdrop-blur-md">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Status Legend
      </h4>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-xs font-medium">Ongoing Projects</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium">Completed Wells</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-amber-500" />
          <span className="text-xs font-medium">Needs Attention</span>
        </div>
      </div>
    </div>
  );
}
