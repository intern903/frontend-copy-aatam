"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { LpHeader, PrimaryButton } from "@/components/life-purpose/ui";
import { MIN_STORIES, TAG_COLOURS, storyImage } from "@/lib/lifePurpose";
import { useApp } from "@/lib/store";

// Life stories. No Figma frame for this step: the list uses the Figma story card front
// (photo, title, keyword tags).
// The stories (and where in the body the client feels them) are written by the coach with the
// client in session, never added here. Until the coach interface exists, they are sample
// stories (lib/data.ts).
export default function StoriesPage() {
  const router = useRouter();
  const { lifePurpose: lp } = useApp();
  const enough = lp.stories.length >= MIN_STORIES;

  return (
    <main className="flex min-h-screen flex-col px-32 pb-40">
      <LpHeader />
      <h1 className="mt-24 font-heading text-h1 text-black">Life Stories</h1>
      {/* Dinesh's opening prompt for the stories, from the Life Purpose workflow. */}
      <p className="mt-4 text-body-small text-black">
        Think of a time in your life when you did something that left you feeling truly fulfilled or satisfied.
      </p>
      <p className="mt-8 text-caption text-ink-50">
        {enough ? `${lp.stories.length} stories, gathered with Dinesh` : "Dinesh adds your stories with you in your session."}
      </p>

      <div className="mt-16 flex flex-col gap-12">
        {lp.stories.map((story, i) => (
          <article key={story.id} className="relative flex h-area-card w-full flex-col justify-end overflow-hidden rounded-24 border-2 border-white p-16 shadow-card">
            <Image src={storyImage(i)} alt="" fill sizes="329px" className="object-cover" />
            <span aria-hidden className="absolute inset-0 bg-black/10" />
            <div className="relative flex flex-col gap-8">
              <h2 className="font-heading text-h4 text-white">{story.title}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-6">
                {story.keywords.map((k, j) => (
                  <span key={k} className={`rounded-pill px-8 py-4 text-caption text-white ${TAG_COLOURS[j % TAG_COLOURS.length]}`}>
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-auto pt-40">
        <PrimaryButton disabled={!enough} onClick={() => router.push("/life-purpose/clustering")}>
          Continue
        </PrimaryButton>
      </div>
    </main>
  );
}
