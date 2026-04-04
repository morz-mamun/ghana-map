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

const normalizeName = (name: string) => name.replace(/\s+/g, "").toLowerCase();

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
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const geojsonCache = useRef<{ regions?: any, districts?: any }>({});

  // Layer IDs
  const regionsSourceId = `regions-src-${id}`;
  const regionsLayerId = `regions-layer-${id}`;
  const ashantiDistrictsSourceId = `districts-src-${id}`;
  const ashantiDistrictsLayerId = `districts-layer-${id}`;
  const regionsOutlineId = `regions-outline-${id}`;

  const resetView = useCallback(() => {
    if (!map) return;
    setView("national");
    setSelectedName(null);
    map.flyTo({
      center: [-1.0232, 7.9465],
      zoom: 6.2,
      duration: 1500,
      pitch: 0,
      bearing: 0
    });
  }, [map]);

  // Load GeoJSON data for programmatic access (search zoom)
  useEffect(() => {
    const loadData = async () => {
      try {
        const [regionsRes, districtsRes] = await Promise.all([
          fetch("/ghana-regions.geojson"),
          fetch("/ashanti-districts.geojson")
        ]);
        geojsonCache.current.regions = await regionsRes.json();
        geojsonCache.current.districts = await districtsRes.json();
      } catch (err) {
        console.error("Failed to load GeoJSON data for search:", err);
      }
    };
    loadData();
  }, []);

  const handleLocationSelect = useCallback((name: string, type: "region" | "district") => {
    if (!map) return;

    if (name === "Ashanti") {
      setView("ashanti");
      map.flyTo({
        center: [-1.6701, 6.7470],
        zoom: 8.5,
        duration: 1500,
        pitch: 20
      });
      return;
    }

    const source = type === "region" ? geojsonCache.current.regions : geojsonCache.current.districts;
    if (!source) return;

    const feature = source.features.find((f: any) =>
      normalizeName(f.properties.shapeName) === normalizeName(name)
    );
    if (!feature) return;

    setSelectedName(feature.properties.shapeName);

    // Simple centroid calculation or better: find a point in the geometry
    // For now, we'll use a basic approach or if it's a district, zoom into Ashanti first
    if (type === "district") {
      setView("ashanti");
    }

    // Handle MultiPolygon/Polygon coordinates for a rough center
    let coords: [number, number][] = [];
    if (feature.geometry.type === "Polygon") {
      coords = feature.geometry.coordinates[0];
    } else if (feature.geometry.type === "MultiPolygon") {
      coords = feature.geometry.coordinates[0][0];
    }

    if (coords.length > 0) {
      // Calculate bbox
      let minLng = coords[0][0], maxLng = coords[0][0];
      let minLat = coords[0][1], maxLat = coords[0][1];
      coords.forEach(([lng, lat]) => {
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      });

      map.fitBounds([minLng, minLat, maxLng, maxLat], {
        padding: 100,
        duration: 1500
      });
    }
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

    // 6. Add Transition properties for animations
    map.setPaintProperty(regionsLayerId, "fill-opacity-transition", { duration: 300 });
    map.setPaintProperty(regionsLayerId, "fill-color-transition", { duration: 300 });
    map.setPaintProperty(regionsOutlineId, "line-width-transition", { duration: 300 });
    map.setPaintProperty(regionsOutlineId, "line-color-transition", { duration: 300 });
    map.setPaintProperty(ashantiDistrictsLayerId, "fill-opacity-transition", { duration: 300 });
    map.setPaintProperty(ashantiDistrictsLayerId, "fill-color-transition", { duration: 300 });

    // --- EVENT HANDLERS ---

    const handleMouseMove = (e: any) => {
      if (!e.features?.length) {
        setHoverInfo(null);
        setHoveredName(null);
        map.getCanvas().style.cursor = "";
        return;
      }

      const feature = e.features[0];
      const name = feature.properties.shapeName;
      const layerId = feature.layer.id;

      // Prioritize Ashanti Districts over Ashanti Region when zoomed in
      if (view === "ashanti" && layerId === regionsLayerId && name === "Ashanti") {
        return;
      }

      setHoveredName(name);

      let stats: StatsType | undefined;

      if (layerId === regionsLayerId) {
        // Find the stats key that matches the normalized name
        const statsKey = Object.keys(statsData.regions).find(
          key => normalizeName(key) === normalizeName(name)
        );
        stats = statsKey ? (statsData.regions as any)[statsKey] : undefined;
      } else if (layerId === ashantiDistrictsLayerId) {
        // Use normalization for districts to ensure robust matching
        const statsKey = Object.keys(statsData.districts).find(
          key => normalizeName(key) === normalizeName(name)
        );
        stats = statsKey ? (statsData.districts as any)[statsKey] : undefined;
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
      setHoveredName(null);
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

  // Sync visual highlights and animations when hover or search state changes
  useEffect(() => {
    if (!map || !isLoaded) return;

    // National Regions Highlights
    const isHighVis = (fName: string) => fName === hoveredName || fName === selectedName;

    map.setPaintProperty(regionsLayerId, "fill-color", [
      "case",
      ["any", ["==", ["get", "shapeName"], selectedName || ""], ["==", ["get", "shapeName"], hoveredName || ""]],
      "#3b82f6", // Bright Blue highlight
      ["==", ["get", "shapeName"], "Ashanti"],
      "#3b82f6", // Ashanti default
      "#94a3b8"  // Other default
    ]);

    map.setPaintProperty(regionsLayerId, "fill-opacity", [
      "case",
      ["any", ["==", ["get", "shapeName"], selectedName || ""], ["==", ["get", "shapeName"], hoveredName || ""]],
      0.9,       // Highlighted opacity
      view === "ashanti" ? 0.05 : [
        "case",
        ["==", ["get", "shapeName"], "Ashanti"],
        0.8,
        0.2
      ]
    ]);

    map.setPaintProperty(regionsOutlineId, "line-width", [
      "case",
      ["any", ["==", ["get", "shapeName"], selectedName || ""], ["==", ["get", "shapeName"], hoveredName || ""]],
      1,         // Bold outline
      ["==", ["get", "shapeName"], "Ashanti"],
      1,         // Ashanti medium outline
      0          // Others thin outline
    ]);

    map.setPaintProperty(regionsOutlineId, "line-color", [
      "case",
      ["any", ["==", ["get", "shapeName"], selectedName || ""], ["==", ["get", "shapeName"], hoveredName || ""]],
      "#ffffff", // Highlighted color
      "#ffffff"  // Default
    ]);

    // Ashanti Districts Highlights
    if (view === "ashanti") {
      map.setPaintProperty(ashantiDistrictsLayerId, "fill-opacity", [
        "case",
        ["any", ["==", ["get", "shapeName"], selectedName || ""], ["==", ["get", "shapeName"], hoveredName || ""]],
        0.8,
        0.4
      ]);
      map.setPaintProperty(ashantiDistrictsLayerId, "fill-color", [
        "case",
        ["any", ["==", ["get", "shapeName"], selectedName || ""], ["==", ["get", "shapeName"], hoveredName || ""]],
        "#059669", // Darker Emerald on highlight
        "#10b981"  // Default Emerald
      ]);
    }
  }, [map, isLoaded, view, hoveredName, selectedName, regionsLayerId, regionsOutlineId, ashantiDistrictsLayerId]);

  // Sync layer visibility when view changes
  useEffect(() => {
    if (!map || !isLoaded) return;

    if (view === "ashanti") {
      map.setLayoutProperty(ashantiDistrictsLayerId, "visibility", "visible");
    } else {
      map.setLayoutProperty(ashantiDistrictsLayerId, "visibility", "none");
    }
  }, [map, isLoaded, view, ashantiDistrictsLayerId]);

  return (
    <>
      <MapSidebar
        onResetView={resetView}
        onLocationSelect={handleLocationSelect}
        selectedName={hoverInfo?.name || null}
      />
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
        zoom={6.5}
        minZoom={6.5}
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
        // className="bottom-4 right-4"
        />
      </Map>
    </div>
  );
}
