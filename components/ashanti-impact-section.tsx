"use client";

import React, { useId, useEffect } from "react";
import { Map, MapMarker, MarkerContent, useMap } from "./ui/map";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { cn } from "@/lib/utils";
import wellData from "@/lib/data/tube-well-stats.json";

// Minimal MapLibre style that only shows a solid background
const MINIMAL_MAP_STYLE = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#ffffff",
      },
    },
  ],
};

interface WellPoint {
  id: string;
  title: string;
  address: string;
  coordinates: [number, number];
  ongoing: number;
  needed: number;
  completed: number;
  peopleInNeed: number;
  status: string;
}

interface MetricCardProps {
  value: string;
  label: string;
  className?: string;
}

function MetricCard({ value, label, className }: MetricCardProps) {
  return (
    <div className={cn("bg-[#F5F5F5] rounded-2xl p-6 flex flex-col gap-1 relative overflow-hidden", className)}>
      <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#E11D48] rounded-r-full" />
      <h3 className="text-3xl font-bold text-gray-900 ml-4">{value}</h3>
      <p className="text-gray-500 text-lg ml-4 leading-tight">{label}</p>
    </div>
  );
}

const statusColors: Record<string, string> = {
  needed: "#E11D48",
  ongoing: "#F59E0B",
  completed: "#10B981",
};

const statusLabels: Record<string, string> = {
  needed: "Needs Repair",
  ongoing: "In Progress",
  completed: "Completed",
};

// Custom Well Marker Icon from User
const WellMarkerIcon = ({ status }: { status: string }) => {
  const colors = {
    needed: { main: "#F7044F", inner: "#EE084E", light: "#FFCCDC" },
    ongoing: { main: "#F59E0B", inner: "#D97706", light: "#FEF3C7" },
    completed: { main: "#10B981", inner: "#059669", light: "#D1FAE5" },
  }[status] || { main: "#6B7280", inner: "#4B5563", light: "#F3F4F6" };

  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
      <rect x="1" y="1" width="19.7241" height="19.7241" rx="9.86207" fill={colors.main} />
      <rect x="0.5" y="0.5" width="20.7241" height="20.7241" rx="10.3621" stroke="black" strokeOpacity="0.05" />
      <path d="M12.9973 15.111C13.9139 14.4325 14.6356 13.7297 15.1888 13.0284L11.9658 9.37177C11.8338 9.22209 11.613 9.18987 11.4438 9.29561L10.1685 10.0927C9.71977 10.3731 9.13733 10.31 8.75908 9.93988C8.25943 9.451 8.30984 8.63262 8.86571 8.20876L10.8619 6.68656L10.2587 6.23531C9.4385 5.61937 8.07319 5.23269 6.50889 6.19223C4.45592 7.45152 3.99139 11.606 8.72678 15.111C9.62872 15.7785 10.0797 16.1123 10.8621 16.1123C11.6444 16.1123 12.0954 15.7785 12.9973 15.111Z" fill={colors.light} />
      <path fillRule="evenodd" clipRule="evenodd" d="M12.4095 15.5462C12.5255 15.4658 12.6461 15.3749 12.7771 15.2761C12.8472 15.2231 12.9203 15.168 12.9973 15.111C12.7766 15.2744 12.5877 15.4228 12.4095 15.5462Z" fill="#D9D9D9" />
      <path d="M15.1888 13.0284L11.9658 9.37177C11.8338 9.22209 11.613 9.18987 11.4437 9.29561L10.1685 10.0927C9.71976 10.3731 9.13732 10.31 8.75907 9.93988C8.25942 9.451 8.30983 8.63262 8.8657 8.20876L10.8619 6.68656L11.4654 6.23531C12.2856 5.61937 13.6509 5.23269 15.2152 6.19223C16.8708 7.20777 17.4934 10.1062 15.1888 13.0284Z" fill="#FFF8EA" />
      <path fillRule="evenodd" clipRule="evenodd" d="M11.9658 9.37177L15.1888 13.0284C14.8174 13.4993 14.37 13.9708 13.8387 14.4352C13.5787 14.6624 13.2985 14.888 12.9973 15.111C12.7766 15.2744 12.5877 15.4228 12.4095 15.5462C11.8596 15.927 11.4529 16.1123 10.862 16.1123C10.0797 16.1123 9.62872 15.7785 8.7268 15.111C3.9914 11.606 4.45591 7.45151 6.50888 6.19223C8.07318 5.23269 9.43849 5.61937 10.2586 6.23531L10.8619 6.68656L8.8657 8.20876C8.30983 8.63262 8.25942 9.451 8.75907 9.93988C9.13732 10.31 9.71976 10.3731 10.1685 10.0927L11.4437 9.29561C11.613 9.18987 11.8338 9.22209 11.9658 9.37177Z" fill={colors.inner} />
      <path d="M12.4095 15.5462C11.8596 15.927 11.4529 16.1123 10.862 16.1123C10.0797 16.1123 9.62872 15.7785 8.7268 15.111C3.9914 11.606 4.45591 7.45151 6.50888 6.19223C8.07318 5.23269 9.43849 5.61937 10.2586 6.23531L10.8619 6.68656M12.4095 15.5462C12.5255 15.4658 12.6461 15.3749 12.7771 15.2761C12.8472 15.2231 12.9203 15.168 12.9973 15.111M12.4095 15.5462C12.5877 15.4228 12.7766 15.2744 12.9973 15.111M12.4095 15.5462L10.6825 13.7674M12.9973 15.111C13.2985 14.888 13.5787 14.6624 13.8387 14.4352M15.1888 13.0284L11.9658 9.37177C11.8338 9.22209 11.613 9.18987 11.4437 9.29561L10.1685 10.0927C9.71976 10.3731 9.13732 10.31 8.75907 9.93988C8.25942 9.451 8.30983 8.63262 8.8657 8.20876L10.8619 6.68656M15.1888 13.0284C17.4934 10.1062 16.8708 7.20777 15.2152 6.19223C13.6509 5.23269 12.2856 5.61937 11.4654 6.23531L10.8619 6.68656M15.1888 13.0284C14.8174 13.4993 14.37 13.9708 13.8387 14.4352M13.8387 14.4352L12.1117 12.6564" stroke="#F9F3E6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

function WellMarker({ well }: { well: WellPoint }) {
  const [open, setOpen] = React.useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(true);
  };

  const handleLeave = () => {
    timerRef.current = setTimeout(() => {
      setOpen(false);
    }, 300);
  };

  return (
    <MapMarker
      longitude={well.coordinates[0]}
      latitude={well.coordinates[1]}
    >
      <MarkerContent>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div
              className="cursor-pointer"
              onMouseEnter={handleEnter}
              onMouseLeave={handleLeave}
              onPointerDown={(e) => e.preventDefault()}
            >
              <WellMarkerIcon status={well.status} />
            </div>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="center"
            sideOffset={12}
            className="p-0 border-0 shadow-2xl rounded-2xl overflow-hidden w-fit"
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          >
            <div className="p-3 flex flex-col gap-3 bg-white min-w-[240px]">
              {/* Status Badge */}
              <div
                className="text-[10px] font-bold px-2 py-0.5 rounded-full w-fit uppercase tracking-wider"
                style={{
                  backgroundColor: (statusColors[well.status] ?? "#6B7280") + "15",
                  color: statusColors[well.status] ?? "#6B7280"
                }}
              >
                {statusLabels[well.status] ?? well.status}
              </div>

              {/* Title & address */}
              <div className="space-y-1">
                <h4 className="font-bold text-gray-900 text-lg leading-tight">
                  {well.title}
                </h4>
                <p className="text-gray-600 text-lg font-medium">{well.address}</p>
              </div>

              {/* Show video CTA */}
              <button
                className="font-semibold text-sm hover:underline w-fit text-left"
                style={{ color: statusColors[well.status] ?? "#F7044F" }}
              >
                Show video
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </MarkerContent>
    </MapMarker>
  );
}

function CustomAshantiMapLayer() {
  const { map, isLoaded } = useMap();
  const id = useId();

  useEffect(() => {
    if (!map || !isLoaded) return;

    const sourceId = `ashanti-districts-${id}`;
    const fillLayerId = `districts-fill-${id}`;
    const lineLayerId = `districts-line-${id}`;
    const labelsLayerId = `districts-labels-${id}`;

    // Set default cursor to arrow
    map.getCanvas().style.cursor = "default";

    // Add Ashanti districts source
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data: "/ashanti-districts.geojson",
      });
    }

    // Districts Fill
    map.addLayer({
      id: fillLayerId,
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": "#FDF2F2",
        "fill-opacity": 1,
      },
    });

    // Districts Outline
    map.addLayer({
      id: lineLayerId,
      type: "line",
      source: sourceId,
      paint: {
        "line-color": "#929292",
        "line-width": 0.5,
      },
    });

    // District Labels
    map.addLayer({
      id: labelsLayerId,
      type: "symbol",
      source: sourceId,
      layout: {
        "text-field": ["get", "shapeName"],
        "text-size": 10,
        "text-allow-overlap": false,
        "text-anchor": "center",
      },
      paint: {
        "text-color": "#000000",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1,
      },
    });

    return () => {
      if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
      if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
      if (map.getLayer(labelsLayerId)) map.removeLayer(labelsLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, isLoaded, id]);

  // Filter wells to only show those in Ashanti
  const ashantiWells = (wellData.wells as WellPoint[]).filter(w => w.address.includes("Ashanti"));

  return (
    <>
      {isLoaded &&
        ashantiWells.map((well) => (
          <WellMarker key={well.id} well={well} />
        ))}
    </>
  );
}

export function AshantiImpactSection() {
  const ashantiStats = wellData.regions.Ashanti;

  return (
    <section className="w-full bg-white py-20 px-4 md:px-10 border-t border-gray-100">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Left Column: The Problem */}
          <div className="lg:col-span-3 flex flex-col gap-8">
            <h2 className="text-4xl font-black text-gray-900 leading-tight">
              Ashanti Impacts
            </h2>
            <div className="flex flex-col gap-6">
              <MetricCard value={`${ashantiStats.needed}+`} label="Broken wells needing fix" />
              <MetricCard value={ashantiStats.peopleInNeed.toLocaleString()} label="People without clean water" />
              <MetricCard value={ashantiStats.ongoing.toString()} label="Ongoing repair projects" />
            </div>
          </div>

          {/* Center Column: The Map */}
          <div className="lg:col-span-6 h-[600px] relative rounded-3xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
            <Map
              center={[-1.4, 6.7]}
              zoom={7.7}
              interactive={false}
              className="h-full w-full"
              styles={{
                light: MINIMAL_MAP_STYLE as any,
                dark: MINIMAL_MAP_STYLE as any,
              }}
            >
              <CustomAshantiMapLayer />
            </Map>

            {/* Label for context */}
            <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200">
              <p className="text-sm font-bold text-gray-900">Ashanti Region District Map</p>
            </div>
          </div>

          {/* Right Column: The Solution */}
          <div className="lg:col-span-3 flex flex-col gap-8">
            <h2 className="text-4xl font-black text-gray-900 leading-tight">
              Our Progress
            </h2>
            <div className="flex flex-col gap-6">
              <MetricCard value={`${ashantiStats.completed}+`} label="Wells fixed in Ashanti" />
              <MetricCard value="150k+" label="Estimated people helped" className="bg-emerald-50! border-emerald-200!" />
              <MetricCard value="100%" label="Commitment to Ashanti" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
