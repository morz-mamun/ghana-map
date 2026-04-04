"use client";

import { useState, useMemo } from "react";
import { Droplets, Info, Search, Map as MapIcon, ChevronRight, X, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import statsData from "@/lib/data/tube-well-stats.json";

interface SidebarProps {
  onResetView: () => void;
  onLocationSelect: (name: string, type: "region" | "district") => void;
  selectedName: string | null;
}

export function MapSidebar({ onResetView, onLocationSelect, selectedName }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];

    const query = searchQuery.toLowerCase();
    const results: { name: string; type: "region" | "district" }[] = [];

    // Search regions
    Object.keys(statsData.regions).forEach(name => {
      if (name.toLowerCase().includes(query)) {
        results.push({ name, type: "region" });
      }
    });

    // Search districts
    Object.keys(statsData.districts).forEach(name => {
      if (name.toLowerCase().includes(query)) {
        results.push({ name, type: "district" });
      }
    });

    return results.slice(0, 8); // Limit results
  }, [searchQuery]);

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
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input 
            type="text" 
            placeholder="Search regions or districts..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border bg-background/50 py-2.5 pl-9 pr-9 text-sm outline-none ring-primary/20 transition-all focus:ring-2 focus:border-primary/50"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-lg border bg-background/95 p-1 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
            {searchResults.map((result) => (
              <button
                key={`${result.type}-${result.name}`}
                onClick={() => {
                  onLocationSelect(result.name, result.type);
                  setSearchQuery("");
                }}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-primary/10 transition-colors"
              >
                <div className={`flex h-6 w-6 items-center justify-center rounded-md ${result.type === 'region' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {result.type === 'region' ? <MapIcon className="h-3.5 w-3.5" /> : <LocateFixed className="h-3.5 w-3.5" />}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{result.name}</span>
                  <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-tight">{result.type}</span>
                </div>
              </button>
            ))}
          </div>
        )}
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
              <div className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 text-sm">
                <ChevronRight className="h-4 w-4 mt-0.5 text-primary" />
                <span>Use the search bar above to find specific areas.</span>
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
