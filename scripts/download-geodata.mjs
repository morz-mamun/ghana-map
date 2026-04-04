/**
 * Downloads Ghana GeoJSON from GADM (includes parent region info on ADM2).
 * Run: node scripts/download-geodata.mjs
 */
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";

const GADM_BASE =
  "https://geodata.ucdavis.edu/gadm/gadm4.1/json";

async function fetchJSON(url) {
  console.log(`  Fetching: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function main() {
  if (!existsSync("./public")) await mkdir("./public", { recursive: true });

  // ── ADM1: 16 Ghana Regions ───────────────────────────────────────────────
  console.log("\n📥 Downloading Ghana ADM1 (regions)…");
  const adm1 = await fetchJSON(`${GADM_BASE}/gadm41_GHA_1.json`);

  const regionNames = adm1.features.map((f) => f.properties.NAME_1).sort();
  console.log(`   Found ${adm1.features.length} regions:`, regionNames);

  // Rename property to shapeName for consistency
  adm1.features.forEach((f) => {
    f.properties.shapeName = f.properties.NAME_1;
  });

  await writeFile(
    "./public/ghana-regions.geojson",
    JSON.stringify(adm1, null, 2)
  );
  console.log("   ✅ Saved public/ghana-regions.geojson");

  // ── ADM2: All Ghana Districts ────────────────────────────────────────────
  console.log("\n📥 Downloading Ghana ADM2 (districts)…");
  const adm2 = await fetchJSON(`${GADM_BASE}/gadm41_GHA_2.json`);
  console.log(`   Found ${adm2.features.length} total districts`);

  // Filter to Ashanti Region only (NAME_1 === 'Ashanti')
  const ashantiFeatures = adm2.features.filter(
    (f) => f.properties.NAME_1 === "Ashanti"
  );
  console.log(`   Ashanti districts: ${ashantiFeatures.length}`);

  const districtNames = ashantiFeatures
    .map((f) => f.properties.NAME_2)
    .sort();
  console.log("   District names:", districtNames);

  // Rename for consistency
  ashantiFeatures.forEach((f) => {
    f.properties.shapeName = f.properties.NAME_2;
    f.properties.parentRegion = f.properties.NAME_1;
  });

  const ashantiGeoJSON = {
    type: "FeatureCollection",
    features: ashantiFeatures,
  };

  await writeFile(
    "./public/ashanti-districts.geojson",
    JSON.stringify(ashantiGeoJSON, null, 2)
  );
  console.log("   ✅ Saved public/ashanti-districts.geojson");

  console.log("\n✅ Done! Copy the names above into tube-well-stats.json.\n");
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
