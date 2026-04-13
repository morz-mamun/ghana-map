"use client";

import React, { useId, useEffect, useState, useRef } from "react";
import { Map, MapMarker, MarkerContent, MapPopup, useMap } from "./ui/map";
import { cn } from "@/lib/utils";
import wellData from "@/lib/data/tube-well-stats.json";

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

interface HoveredWell {
  well: WellPoint;
  coordinates: [number, number];
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

// SVG location pin icon colored by status
function LocationPin({ color }: { color: string }) {
  return (
    <svg
      width="18"
      height="24"
      viewBox="0 0 28 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      overflow="visible"
      style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }}
    >
      <path
        d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
        fill={color}
      />
      <circle cx="14" cy="13" r="5" fill="white" />
    </svg>
  );
}

function CustomMapLayer() {
  const { map, isLoaded } = useMap();
  const id = useId();
  const [hoveredWell, setHoveredWell] = useState<HoveredWell | null>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const sourceId = `ghana-regions-${id}`;
    const fillLayerId = `regions-fill-${id}`;
    const lineLayerId = `regions-line-${id}`;
    const labelsLayerId = `regions-labels-${id}`;

    // Add regions source
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data: "/ghana-regions.geojson",
      });
    }

    // Regions Fill
    map.addLayer({
      id: fillLayerId,
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": [
          "case",
          ["==", ["get", "shapeName"], "Ashanti"],
          "#E11D48",
          "#FDF2F2",
        ],
        "fill-opacity": 1,
      },
    });

    // Regions Outline
    map.addLayer({
      id: lineLayerId,
      type: "line",
      source: sourceId,
      paint: {
        "line-color": "#000000",
        "line-width": 0.5,
      },
    });

    // Labels
    map.addLayer({
      id: labelsLayerId,
      type: "symbol",
      source: sourceId,
      layout: {
        "text-field": ["get", "shapeName"],
        "text-size": 11,
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": [
          "case",
          ["==", ["get", "shapeName"], "Ashanti"],
          "#ffffff",
          "#000000",
        ],
      },
    });

    return () => {
      if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
      if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
      if (map.getLayer(labelsLayerId)) map.removeLayer(labelsLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, isLoaded, id]);

  return (
    <>
      {/* Location pin markers for each well */}
      {isLoaded && (wellData.wells as WellPoint[]).map((well) => (
        <MapMarker
          key={well.id}
          longitude={well.coordinates[0]}
          latitude={well.coordinates[1]}
          anchor="bottom"
          className="border border-red-300"
          onMouseEnter={() => {
            if (hideTimeout.current) clearTimeout(hideTimeout.current);
            setHoveredWell({
              well,
              coordinates: well.coordinates,
            });
          }}
          onMouseLeave={() => {
            hideTimeout.current = setTimeout(() => {
              setHoveredWell(null);
            }, 150);
          }}
        >
          <MarkerContent>
            <LocationPin color={statusColors[well.status] ?? "#6B7280"} />
          </MarkerContent>
        </MapMarker>
      ))}

      {hoveredWell && (
        <MapPopup
          longitude={hoveredWell.coordinates[0]}
          latitude={hoveredWell.coordinates[1]}
          closeButton={false}
          closeOnClick={false}
          maxWidth="280px"
          offset={16}
          anchor="bottom"
          className="!p-0 !border-0 !shadow-xl !rounded-2xl overflow-hidden"
        >
          <div
            className="p-3 flex flex-col gap-2 bg-white rounded-2xl min-w-[220px]"
            onMouseEnter={() => {
              if (hideTimeout.current) clearTimeout(hideTimeout.current);
            }}
            onMouseLeave={() => {
              hideTimeout.current = setTimeout(() => {
                setHoveredWell(null);
              }, 100);
            }}
          >
            {/* Status badge */}
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full w-fit"
              style={{
                backgroundColor: statusColors[hoveredWell.well.status] + "20",
                color: statusColors[hoveredWell.well.status],
              }}
            >
              {statusLabels[hoveredWell.well.status] ?? hoveredWell.well.status}
            </span>

            {/* Title & address */}
            <div className="space-y-0.5">
              <h4 className="font-bold text-gray-900 text-base leading-tight">
                {hoveredWell.well.title}
              </h4>
              <p className="text-gray-500 text-xs">
                {hoveredWell.well.address}
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100">
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-amber-500">{hoveredWell.well.ongoing}</span>
                <span className="text-[10px] text-gray-400 leading-tight text-center">Ongoing</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-[#E11D48]">{hoveredWell.well.needed}</span>
                <span className="text-[10px] text-gray-400 leading-tight text-center">Needed</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-emerald-500">{hoveredWell.well.completed}</span>
                <span className="text-[10px] text-gray-400 leading-tight text-center">Done</span>
              </div>
            </div>

            {/* People in need */}
            <p className="text-[10px] text-gray-400 pt-0.5">
              👥 <span className="font-semibold text-gray-600">{hoveredWell.well.peopleInNeed.toLocaleString()}</span> people in need
            </p>

            {/* Show video CTA */}
            <button className="text-[#E11D48] font-semibold text-xs flex items-center gap-1 hover:underline w-fit">
              ▶ Show video
            </button>
          </div>
        </MapPopup>
      )}
    </>
  );
}

export function MapSection() {
  return (
    <section className="w-full bg-white py-20 px-4 md:px-10">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

          {/* Left Column: The Problem */}
          <div className="lg:col-span-3 flex flex-col gap-8">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900">
              The Problem
            </h2>
            <div className="flex flex-col gap-6">
              <MetricCard value="1,250+" label="Broken wells identified" />
              <MetricCard value="1.5 Million" label="People affected daily" />
              <MetricCard value="Up To 22,000" label="Broken nationwide" />
            </div>
          </div>

          {/* Center Column: The Map */}
          <div className="lg:col-span-6 h-[700px] relative border-2">
            <Map
              center={[-1.0232, 7.9465]}
              zoom={6.2}
              interactive={true}
              dragPan={false}
              scrollZoom={false}
              doubleClickZoom={false}
              dragRotate={false}
              touchZoomRotate={false}
              keyboard={false}
              className="h-full w-full"
            >
              <CustomMapLayer />
            </Map>
          </div>

          {/* Right Column: The Solution */}
          <div className="lg:col-span-3 flex flex-col gap-8">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900">
              The Solution
            </h2>
            <div className="flex flex-col gap-6">
              <MetricCard value="1,000+" label="Wells fixed!" />
              <MetricCard value="500k+" label="People got pure water" />
              <MetricCard value="Up To 22,000" label="Broken nationwide" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
