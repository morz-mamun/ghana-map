"use client";

import { useEffect, useState, useId, useCallback, useRef } from "react";
import {
  Map,
  MapControls,
  MapPopup,
  useMap
} from "./ui/map";
import { RegionStatsPopup } from "./region-stats-popup";
import { MapSidebar } from "./map-sidebar";
import { MapLegend } from "./map-legend";
import statsData from "@/lib/data/tube-well-stats.json";

// Types for our stats
type StatsType = typeof statsData.regions["Ashanti"];

interface HoverState {
  name: string;
  stats: StatsType;
  coordinates: [number, number];
}

function GhanaMapLayer() {
  const { map, isLoaded } = useMap();
  const id = useId();

  // States
  const [view, setView] = useState<"national" | "ashanti">("national");
  const [hoverInfo, setHoverInfo] = useState<HoverState | null>(null);

  // Layer IDs
  const regionsSourceId = `regions-src-${id}`;
  const regionsLayerId = `regions-layer-${id}`;
  const ashantiDistrictsSourceId = `districts-src-${id}`;
  const ashantiDistrictsLayerId = `districts-layer-${id}`;
  const regionsOutlineId = `regions-outline-${id}`;

  const resetView = useCallback(() => {
    if (!map) return;
    setView("national");
    map.flyTo({
      center: [-1.0232, 7.9465],
      zoom: 6.2,
      duration: 1500,
      pitch: 0,
      bearing: 0
    });
  }, [map]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    // 1. Add Regions Source (ADM1)
    map.addSource(regionsSourceId, {
      type: "geojson",
      data: "/ghana-regions.geojson",
    });

    // 2. Add Ashanti Districts Source (ADM2)
    map.addSource(ashantiDistrictsSourceId, {
      type: "geojson",
      data: "/ashanti-districts.geojson",
    });

    // 3. Regions Fill Layer
    map.addLayer({
      id: regionsLayerId,
      type: "fill",
      source: regionsSourceId,
      paint: {
        // "Blur" effect: Ashanti is bright, others are desaturated/low opacity
        "fill-color": [
          "case",
          ["==", ["get", "shapeName"], "Ashanti"],
          "#3b82f6", // Ashanti highlight
          "#94a3b8"  // Other regions (muted slate)
        ],
        "fill-opacity": [
          "case",
          ["==", ["get", "shapeName"], "Ashanti"],
          0.8,
          0.2
        ],
      },
    });

    // 4. Regions Outline
    map.addLayer({
      id: regionsOutlineId,
      type: "line",
      source: regionsSourceId,
      paint: {
        "line-color": "#ffffff",
        "line-width": [
          "case",
          ["==", ["get", "shapeName"], "Ashanti"],
          3,
          1
        ],
        "line-opacity": 0.5
      }
    });

    // 5. Ashanti Districts Fill Layer (Hidden initially)
    map.addLayer({
      id: ashantiDistrictsLayerId,
      type: "fill",
      source: ashantiDistrictsSourceId,
      layout: {
        "visibility": "none"
      },
      paint: {
        "fill-color": "#10b981", // Emerald for districts
        "fill-opacity": 0.4,
        "fill-outline-color": "#ffffff"
      }
    });

    // --- EVENT HANDLERS ---

    const handleMouseMove = (e: any) => {
      if (!e.features?.length) {
        setHoverInfo(null);
        map.getCanvas().style.cursor = "";
        return;
      }

      const feature = e.features[0];
      const name = feature.properties.shapeName;
      const layerId = feature.layer.id;

      let stats: StatsType | undefined;

      if (layerId === regionsLayerId) {
        stats = (statsData.regions as any)[name];
      } else if (layerId === ashantiDistrictsLayerId) {
        stats = (statsData.districts as any)[name];
      }

      if (stats) {
        setHoverInfo({
          name,
          stats,
          coordinates: [e.lngLat.lng, e.lngLat.lat]
        });
        map.getCanvas().style.cursor = "pointer";
      }
    };

    const handleMouseLeave = () => {
      setHoverInfo(null);
      map.getCanvas().style.cursor = "";
    };

    const handleClick = (e: any) => {
      if (!e.features?.length) return;

      const feature = e.features[0];
      const name = feature.properties.shapeName;

      if (name === "Ashanti" && view === "national") {
        setView("ashanti");
        // Zoom to Ashanti bounds
        map.flyTo({
          center: [-1.6701, 6.7470],
          zoom: 8.5,
          duration: 1500,
          pitch: 20
        });
      }
    };

    // Attach listeners
    map.on("mousemove", regionsLayerId, handleMouseMove);
    map.on("mouseleave", regionsLayerId, handleMouseLeave);
    map.on("click", regionsLayerId, handleClick);

    map.on("mousemove", ashantiDistrictsLayerId, handleMouseMove);
    map.on("mouseleave", ashantiDistrictsLayerId, handleMouseLeave);

    return () => {
      map.off("mousemove", regionsLayerId, handleMouseMove);
      map.off("mouseleave", regionsLayerId, handleMouseLeave);
      map.off("click", regionsLayerId, handleClick);
      map.off("mousemove", ashantiDistrictsLayerId, handleMouseMove);
      map.off("mouseleave", ashantiDistrictsLayerId, handleMouseLeave);

      try {
        if (map.getLayer(regionsLayerId)) map.removeLayer(regionsLayerId);
        if (map.getLayer(regionsOutlineId)) map.removeLayer(regionsOutlineId);
        if (map.getLayer(ashantiDistrictsLayerId)) map.removeLayer(ashantiDistrictsLayerId);
        if (map.getSource(regionsSourceId)) map.removeSource(regionsSourceId);
        if (map.getSource(ashantiDistrictsSourceId)) map.removeSource(ashantiDistrictsSourceId);
      } catch (err) {
        console.warn("Cleanup error:", err);
      }
    };
  }, [map, isLoaded, regionsSourceId, regionsLayerId, regionsOutlineId, ashantiDistrictsSourceId, ashantiDistrictsLayerId, view]);

  // Sync layer visibility when view changes
  useEffect(() => {
    if (!map || !isLoaded) return;

    if (view === "ashanti") {
      map.setLayoutProperty(ashantiDistrictsLayerId, "visibility", "visible");
      // Mute national regions even more
      map.setPaintProperty(regionsLayerId, "fill-opacity", 0.05);
    } else {
      map.setLayoutProperty(ashantiDistrictsLayerId, "visibility", "none");
      // Restore national regions visibility
      map.setPaintProperty(regionsLayerId, "fill-opacity", [
        "case",
        ["==", ["get", "shapeName"], "Ashanti"],
        0.8,
        0.2
      ]);
    }
  }, [map, isLoaded, view, ashantiDistrictsLayerId, regionsLayerId]);

  return (
    <>
      <MapSidebar onResetView={resetView} selectedName={hoverInfo?.name || null} />
      <MapLegend />

      {hoverInfo && (
        <MapPopup
          longitude={hoverInfo.coordinates[0]}
          latitude={hoverInfo.coordinates[1]}
          closeButton={false}
          closeOnClick={false}
          maxWidth="300px"
          offset={15}
          className="pointer-events-none"
        >
          <RegionStatsPopup name={hoverInfo.name} stats={hoverInfo.stats} />
        </MapPopup>
      )}
    </>
  );
}

export function GhanaTubeWellMap() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-background">
      <Map
        center={[-1.0232, 7.9465]}
        zoom={6.2}
        minZoom={5}
        maxZoom={12}
        className="h-full w-full"
      >
        <GhanaMapLayer />
        <MapControls
          position="bottom-right"
          showZoom
          showCompass
          showLocate
          showFullscreen
          className="bottom-4 right-4"
        />
      </Map>
    </div>
  );
}
