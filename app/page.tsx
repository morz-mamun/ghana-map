import { GhanaTubeWellMap } from "@/components/ghana-map";
import { MapSection } from "@/components/map-section";
import { AshantiImpactSection } from "@/components/ashanti-impact-section";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full overflow-y-auto">
      <div className="relative h-screen w-full border-b">
        <GhanaTubeWellMap />
      </div>
      <MapSection />
      <AshantiImpactSection />
    </main>
  );
}
