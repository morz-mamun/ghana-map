"use client";

import { Droplets, Info, Search, Map as MapIcon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  onResetView: () => void;
  selectedName: string | null;
}

export function MapSidebar({ onResetView, selectedName }: SidebarProps) {
  return (
    <div className="absolute top-4 left-4 z-20 flex h-[calc(100vh-32px)] w-80 flex-col gap-4 rounded-xl border bg-background/90 p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Droplets className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Ghana Well Map</h2>
          <p className="text-xs text-muted-foreground uppercase font-medium">Tube Well Project Dashboard</p>
        </div>
      </div>

      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search regions..." 
          className="w-full rounded-lg border bg-background/50 py-2 pl-9 pr-4 text-sm outline-none ring-primary/20 focus:ring-2 focus:border-primary/50"
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        <div className="mt-4 space-y-4">
          <div className="rounded-lg bg-muted/40 p-4 border border-border">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              Summary Overview
            </h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Tracking 16 regions across Ghana. Current focus: <strong className="text-foreground">Ashanti Region</strong> and its 43 districts.
            </p>
          </div>

          {selectedName && (
            <div className="rounded-lg bg-primary/5 p-4 border border-primary/20 animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Selected</span>
              <h3 className="text-lg font-bold">{selectedName}</h3>
            </div>
          )}

          <div className="space-y-1">
            <h4 className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Instructions</h4>
            <div className="flex flex-col gap-1 px-1">
              <div className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 text-sm">
                <ChevronRight className="h-4 w-4 mt-0.5 text-primary" />
                <span>Hover over any region to see quick stats.</span>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 text-sm">
                <ChevronRight className="h-4 w-4 mt-0.5 text-primary" />
                <span>Click <strong className="text-primary font-semibold underline decoration-2 underline-offset-1">Ashanti Region</strong> to see district-level data.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-2 pt-4 border-t">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 h-10 border-dashed"
          onClick={onResetView}
        >
          <MapIcon className="h-4 w-4" />
          Full Ghana View
        </Button>
      </div>
    </div>
  );
}
