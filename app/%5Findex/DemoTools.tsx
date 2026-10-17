"use client";

import {
  clearCif,
  clearEngine,
  clearLifePurpose,
  clearValues,
  clearVisions,
  loadSampleCif,
  loadSampleEngine,
  loadSampleLifePurpose,
  loadSampleValues,
  loadSampleVisions,
  useApp,
} from "@/lib/store";

// Internal demo controls (not part of the product): Life Purpose starts empty for real
// clients, so these load Meera's sample to preview the draft and final screens. Visions too.
export default function DemoTools() {
  const { lifePurpose, visions, values, outcomes, lifeCodes, cif } = useApp();
  return (
    <section>
      <h2>CIF demo data</h2>
      <p>Now: {cif.progress.submittedAt ? "submitted (other modules open)" : "not submitted (other modules locked)"}</p>
      <p>
        <button type="button" className="underline" onClick={loadSampleCif}>
          Load Meera&apos;s submitted CIF
        </button>
        {" · "}
        <button type="button" className="underline" onClick={clearCif}>
          Clear the CIF
        </button>
      </p>
      <h2>Life Purpose demo data</h2>
      <p>Now: {lifePurpose.status} · {lifePurpose.stories.length} stories</p>
      <p>
        <button type="button" className="underline" onClick={() => loadSampleLifePurpose("draft")}>
          Load Meera&apos;s sample as a draft
        </button>
        {" · "}
        <button type="button" className="underline" onClick={() => loadSampleLifePurpose("final")}>
          Load as final
        </button>
        {" · "}
        <button type="button" className="underline" onClick={clearLifePurpose}>
          Clear (empty state)
        </button>
      </p>
      <h2>Visions demo data</h2>
      <p>Now: {Object.keys(visions.byLifeArea).length} visions</p>
      <p>
        <button type="button" className="underline" onClick={loadSampleVisions}>
          Load Meera&apos;s sample visions
        </button>
        {" · "}
        <button type="button" className="underline" onClick={clearVisions}>
          Clear visions
        </button>
      </p>
      <h2>Values &amp; Qualities demo data</h2>
      <p>Now: {values.final.length} confirmed values</p>
      <p>
        <button type="button" className="underline" onClick={loadSampleValues}>
          Load Meera&apos;s sample values and qualities
        </button>
        {" · "}
        <button type="button" className="underline" onClick={clearValues}>
          Clear values, qualities and the discovery run
        </button>
      </p>
      <h2>Outcomes, Well-Being &amp; Life Code demo data</h2>
      <p>
        Now: {outcomes.period ? `period ${outcomes.period.number} running` : "no period"} · {outcomes.pastPeriods.length} past ·{" "}
        {lifeCodes.length} life codes
      </p>
      <p>
        <button type="button" className="underline" onClick={loadSampleEngine}>
          Load Meera&apos;s period 7, past periods and life codes
        </button>
        {" · "}
        <button type="button" className="underline" onClick={clearEngine}>
          Clear (empty state)
        </button>
      </p>
    </section>
  );
}
