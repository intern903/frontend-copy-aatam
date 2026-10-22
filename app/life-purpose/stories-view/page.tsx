"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { LpHeader, MapNode } from "@/components/life-purpose/ui";
import { useSwipe } from "@/components/life-purpose/useSwipe";
import BottomNav from "@/components/shell/BottomNav";
import type { Story } from "@/lib/data";
import { STORY_QUESTIONS, TAG_COLOURS, storyImage } from "@/lib/lifePurpose";
import { useApp } from "@/lib/store";

// Figma "LP - Life Stories": a gallery of the client's stories. The middle card is in front,
// its neighbours peek out at 25%. Swipe (or ←/→) to move through them; tap the card to turn
// it over and read the story ("Read More >"). The Life Purpose node goes back to the final screen.
export default function StoriesViewPage() {
  const { lifePurpose: lp } = useApp();
  const stories = lp.stories;
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const go = useCallback(
    (step: number) => {
      setFlipped(false);
      setIndex((i) => Math.min(stories.length - 1, Math.max(0, i + step)));
    },
    [stories.length],
  );
  const swipe = useSwipe({ onSwipeLeft: () => go(1), onSwipeRight: () => go(-1) });

  return (
    <main {...swipe} className="relative h-[100dvh] w-full touch-pan-y overflow-hidden">
      <div className="absolute inset-x-32 top-0">
        <LpHeader search />
      </div>

      <Image src="/images/life-purpose/connector-stories.svg" alt="" width={123} height={151} className="absolute right-0 top-[165px] rotate-180" />
      <div className="absolute right-32 top-[130px]">
        <MapNode href="/life-purpose/final" icon="/icons/star-green.svg" label="Life Purpose" />
      </div>
      <p className="absolute right-[108px] top-[135px] font-heading text-h4 text-black">Life Purpose</p>
      <p className="absolute right-[108px] top-[161px] w-[154px] text-right text-caption text-ink-50">
        The thread through every moment when I’m most alive
      </p>

      {stories.length === 0 ? (
        <p className="absolute inset-x-32 top-[300px] text-center text-body text-ink-50">Your stories will appear here.</p>
      ) : (
        <>
          {index > 0 && <SideCard story={stories[index - 1]} image={storyImage(index - 1)} left={137} onClick={() => go(-1)} />}
          {index < stories.length - 1 && <SideCard story={stories[index + 1]} image={storyImage(index + 1)} left={257} onClick={() => go(1)} />}
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            aria-label={flipped ? `${stories[index].title}, showing the story` : `${stories[index].title}. Read more`}
            className="absolute left-1/2 top-[238px] h-story-card w-story-card -translate-x-1/2 [perspective:1000px]"
          >
            <div
              className="relative size-full transition-transform duration-500 [transform-style:preserve-3d]"
              style={{ transform: flipped ? "rotateY(180deg)" : undefined }}
            >
              <CardFront story={stories[index]} image={storyImage(index)} />
              <CardBack story={stories[index]} onClose={() => setFlipped(false)} />
            </div>
          </button>
          <p className="absolute inset-x-0 top-[600px] text-center text-caption text-ink-50">
            {index + 1} of {stories.length}
          </p>
        </>
      )}

      <BottomNav active="foundation" />
    </main>
  );
}

function Tags({ keywords }: { keywords: string[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-6">
      {keywords.map((k, j) => (
        <span key={k} className={`rounded-pill px-8 py-4 text-caption text-white ${TAG_COLOURS[j % TAG_COLOURS.length]}`}>
          {k}
        </span>
      ))}
    </div>
  );
}

function CardFront({ story, image }: { story: Story; image: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-end justify-between overflow-hidden rounded-24 border-2 border-white p-20 text-left shadow-image [backface-visibility:hidden]">
      <Image src={image} alt="" fill sizes="250px" className="object-cover" />
      <span aria-hidden className="absolute inset-0 bg-black/10" />
      <span className="relative text-caption text-white">Read More &gt;</span>
      <div className="relative flex w-full flex-col gap-8">
        <h2 className="font-heading text-h2 text-white">{story.title}</h2>
        <Tags keywords={story.keywords} />
      </div>
    </div>
  );
}

function CardBack({ story, onClose }: { story: Story; onClose: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col gap-12 overflow-y-auto rounded-24 border-2 border-white bg-white p-16 text-left shadow-image [backface-visibility:hidden] [transform:rotateY(180deg)]">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-h4 text-black">{story.title}</h2>
          <span
            role="button"
            tabIndex={0}
            aria-label="Close"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="flex size-icon items-center justify-center"
          >
            <Image src="/icons/x.svg" alt="" width={20} height={20} />
          </span>
        </div>
        <div className="border-t border-black" />
      </div>
      <Tags keywords={story.keywords} />
      <div className="flex flex-col gap-8 text-body-small text-black">
        {story.text && <p>{story.text}</p>}
        {[story.doing, story.value, story.feeling].map((answer, i) => (
          <p key={i}>
            <span className="text-ink-50">{STORY_QUESTIONS[i]} </span>
            {answer}
          </p>
        ))}
      </div>
    </div>
  );
}

function SideCard({ story, image, left, onClick }: { story: Story; image: string; left: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Go to ${story.title}`}
      className="absolute top-[263px] h-[300px] w-story-card -translate-x-1/2 overflow-hidden rounded-24 opacity-25"
      style={{ left }}
    >
      <Image src={image} alt="" fill sizes="250px" className="object-cover" />
    </button>
  );
}
