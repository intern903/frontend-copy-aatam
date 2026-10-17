"use client";

import Link from "next/link";
import { useState } from "react";
import { VqFrame, useDiscovery } from "@/components/values/ui";
import {
  finalView,
  plainText,
  type FinalView,
  type Run,
} from "@/lib/discovery";

// Figma "VQ - Begin" (results): what the answers say. The values and qualities shown are the
// confirmed lists (the client's checks override the scores) and are saved to store.values and
// store.qualities when the checks finish. Sections with nothing in them are left out.
//
// HARD RULE: the client never sees a score, a theme code or a stage name anywhere in this module.
export default function ResultsPage() {
  const { run } = useDiscovery();
  if (!run) return null;
  return <Results run={run} view={finalView(run.state)} />;
}

function Results({ run, view }: { run: Run; view: FinalView }) {
  const [copy, setCopy] = useState<"idle" | "copied" | "fallback">("idle");
  const text = plainText(view);

  async function copyResults() {
    try {
      await navigator.clipboard.writeText(text);
      setCopy("copied");
    } catch {
      // Clipboard blocked: show the text to select and copy by hand.
      setCopy("fallback");
    }
  }

  return (
    <VqFrame run={run}>
      <div className="flex flex-col gap-20">
        <div className="flex flex-col gap-4">
          <h1 className="font-heading text-h2 text-black">
            What your answers say
          </h1>
          <p className="text-body-small text-ink-50">{view.sentence}</p>
        </div>

        <Section
          title="Your values"
          caption="What you steer by. Ranked, strongest first."
        >
          <RankedList items={view.values} tint="bg-blue-100" />
        </Section>

        <Section
          title="Your qualities"
          caption="How you tend to show up when life pushes on you."
        >
          <RankedList items={view.qualities} tint="bg-yellow-100" />
        </Section>

        {view.tensions.length > 0 && (
          <Section title="A tension worth noticing">
            <div className="flex flex-col gap-12 rounded-24 bg-pink-100 p-16">
              {view.tensions.map((t, i) => (
                <div key={t.keep + t.drop} className="flex flex-col gap-12">
                  {i > 0 && (
                    <span className="border-t-hairline border-black/50" />
                  )}
                  <p className="text-body-small text-black">
                    When you had to choose, you kept {t.keep} and gave up{" "}
                    {t.drop} first, yet both rank high for you. That pull is
                    worth talking through.
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {view.added.length > 0 && (
          <Section title="Added by you">
            <Names
              names={view.added.map((a) => a.name)}
              tint="bg-white text-black"
            />
          </Section>
        )}

        {view.growingToward.length > 0 && (
          <Section
            title="What you are growing toward"
            caption="True in part, and worth building."
          >
            <Names
              names={view.growingToward.map((x) => x.name)}
              tint="bg-primary-500 text-white"
            />
          </Section>
        )}

        {view.setAside.length > 0 && (
          <Section
            title="Set aside"
            caption="These may reflect other people’s expectations more than your own."
          >
            <Names
              names={view.setAside.map((x) => x.name)}
              tint="bg-pink-500 text-white"
            />
          </Section>
        )}

        {/* The confirmed lists live on My Values / My Qualities, inside My Foundation. */}
        <Link
          href="/values/mine"
          className="w-full rounded-8 bg-primary-600 py-16 text-center text-button-cta text-white"
        >
          See My Values &amp; Qualities
        </Link>
        <div className="flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={copyResults}
            className="rounded-8 border border-primary-600 px-16 py-12 text-button-cta text-primary-600"
          >
            {copy === "copied" ? "Copied" : "Copy my results"}
          </button>
          <Link
            href="/book-call"
            className="rounded-8 bg-primary-600 px-24 py-12 text-button-cta text-white"
          >
            Book a Call with Dinesh
          </Link>
        </div>
        {copy === "fallback" && (
          <div className="flex flex-col gap-4">
            <textarea
              readOnly
              value={text}
              rows={10}
              onFocus={(e) => e.currentTarget.select()}
              autoFocus
              aria-label="Your results as text"
              className="w-full resize-none rounded-12 border-hairline border-background-600 bg-white p-12 text-body-small text-black"
            />
            <p className="text-caption text-ink-50">
              Select the text above and copy it.
            </p>
          </div>
        )}
        <p className="text-center text-caption text-ink-50">
          Bring this to your next conversation with your coach.
        </p>
      </div>
    </VqFrame>
  );
}

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-12">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-h3 text-black">{title}</h2>
        {caption && <p className="text-body-small text-ink-50">{caption}</p>}
      </div>
      {children}
    </section>
  );
}

/** Ranked items: name (H4), then its label and the moments that credited it. */
function RankedList({
  items,
  tint,
}: {
  items: FinalView["values"];
  tint: string;
}) {
  if (!items.length)
    return (
      <p className="text-body-small text-ink-50">
        Nothing came through clearly here this time.
      </p>
    );
  return (
    <div className={`flex flex-col gap-8 rounded-24 p-16 ${tint}`}>
      {items.map((x, i) => (
        <div key={x.key} className="flex flex-col gap-8">
          {i > 0 && <span className="border-t-hairline border-black/50" />}
          <div className="flex flex-col gap-4">
            <p className="flex items-center gap-8 font-heading text-h4 text-black">
              {x.name}
              {x.mostLikeYou && (
                <span className="rounded-pill bg-primary-600 px-8 font-body text-caption text-white">
                  Most like you
                </span>
              )}
            </p>
            <p className="text-body-small text-black/75">
              {x.label} · {x.trail.join(", ")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Names({ names, tint }: { names: string[]; tint: string }) {
  return (
    <div className="flex flex-wrap gap-8">
      {names.map((n) => (
        <span
          key={n}
          className={`rounded-24 p-16 font-heading text-h4 ${tint}`}
        >
          {n}
        </span>
      ))}
    </div>
  );
}
