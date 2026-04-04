import { LayerMarkersExample } from "@/components/demo-ghana-map";
import { GhanaTubeWellMap } from "@/components/ghana-map";

export default function Home() {
  return (
    <main className="relative h-screen w-full overflow-hidden">
      {/* <GhanaTubeWellMap /> */}
      <LayerMarkersExample />
    </main>
  );
}
