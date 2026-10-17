import { FloatingBack } from "@/components/shell/BackButton";
import Link from "next/link";
import { screens, type Screen } from "@/lib/screens";
import DemoTools from "./DemoTools";

// Internal navigation for demos — not part of the product, deliberately plain.
// (Folder is "%5Findex" because Next.js treats "_index" as a private folder.)
export default function ScreenIndex() {
  const modules = new Map<string, Screen[]>();
  for (const screen of screens) {
    modules.set(screen.module, [...(modules.get(screen.module) ?? []), screen]);
  }

  return (
    <main className="p-16">
      <FloatingBack />
      <h1>Screens</h1>
      <DemoTools />
      {Array.from(modules, ([module, items]) => (
        <section key={module}>
          <h2>{module}</h2>
          <ul>
            {items
              .sort((a, b) => a.step - b.step)
              .map((screen) => (
                <li key={`${screen.module}-${screen.step}`}>
                  <Link href={screen.path} className="underline">
                    {screen.step}. {screen.title}
                  </Link>
                  {screen.built && " ✓"}
                </li>
              ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
