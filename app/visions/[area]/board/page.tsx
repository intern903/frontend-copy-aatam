"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { LifeAreaId } from "@/lib/data";
import { areaName, isLifeArea } from "@/lib/visions";

// The client's vision board for one life area (not in Figma): add photos from the device and
// drag them anywhere on the board.
//
// Prototype only: the photos are held in memory as URL.createObjectURL links and are NOT saved —
// after a reload they are gone. Only their positions are saved to localStorage, so photos added
// again land where the earlier ones were.

const PHOTO = 120; // size-board-photo
type Spot = { x: number; y: number };
type Photo = Spot & { id: number; url: string };

const storageKey = (area: LifeAreaId) => `bridge-vision-board:${area}`;

function readSpots(area: LifeAreaId): Spot[] {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey(area)) ?? "[]") as Spot[];
  } catch {
    return [];
  }
}

function writeSpots(area: LifeAreaId, photos: Photo[]) {
  try {
    window.localStorage.setItem(storageKey(area), JSON.stringify(photos.map(({ x, y }) => ({ x, y }))));
  } catch {
    // Blocked or full storage: the board still works for this visit.
  }
}

export default function BoardPage({ params }: { params: { area: string } }) {
  if (!isLifeArea(params.area)) notFound();
  return <Board area={params.area} />;
}

function Board({ area }: { area: LifeAreaId }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const board = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const drag = useRef<{ id: number; dx: number; dy: number } | null>(null);
  const nextId = useRef(0);

  // Free the in-memory photos when leaving the board.
  const urls = useRef<string[]>([]);
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  function add(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    const saved = readSpots(area);
    setPhotos((current) => {
      const added = files.map((file, i) => {
        const index = current.length + i;
        const url = URL.createObjectURL(file);
        urls.current.push(url);
        const spot = saved[index] ?? { x: 16 + (index % 3) * 24, y: 16 + index * 24 };
        return { id: nextId.current++, url, ...spot };
      });
      const next = [...current, ...added];
      writeSpots(area, next);
      return next;
    });
  }

  function onPointerDown(e: React.PointerEvent, p: Photo) {
    const rect = board.current!.getBoundingClientRect();
    drag.current = { id: p.id, dx: e.clientX - rect.left - p.x, dy: e.clientY - rect.top - p.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    // Bring the photo being moved to the front.
    setPhotos((ps) => [...ps.filter((x) => x.id !== p.id), p]);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const rect = board.current!.getBoundingClientRect();
    const x = Math.min(rect.width - PHOTO, Math.max(0, e.clientX - rect.left - d.dx));
    const y = Math.min(rect.height - PHOTO, Math.max(0, e.clientY - rect.top - d.dy));
    setPhotos((ps) => ps.map((p) => (p.id === d.id ? { ...p, x, y } : p)));
  }

  function onPointerUp() {
    if (!drag.current) return;
    drag.current = null;
    setPhotos((ps) => {
      writeSpots(area, ps);
      return ps;
    });
  }

  return (
    <main className="flex flex-col gap-16 px-32 pb-40 pt-header-top">
      <div className="flex h-icon-button items-center justify-between">
        <Link href={`/visions/${area}/write`} aria-label="Back" className="flex size-icon-button items-center justify-center rounded-pill bg-white">
          <Image src="/icons/arrow-left.svg" alt="" width={24} height={24} />
        </Link>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="rounded-8 bg-primary-600 px-12 py-8 text-button-cta text-white"
        >
          Add photos
        </button>
      </div>
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-h3 text-black">My {areaName(area)} Vision Board</h1>
        <p className="text-caption text-ink-50">Drag your photos anywhere. Photos aren’t kept after you leave this page.</p>
      </div>

      <div
        ref={board}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative h-vision-board w-content touch-none overflow-hidden rounded-24 bg-white"
      >
        {photos.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center p-24 text-center text-body-small text-ink-50">
            Add photos that show what this area looks like when you live on purpose.
          </p>
        )}
        {photos.map((p) => (
          // Object URLs from the device, so next/image can't optimise them.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={p.id}
            src={p.url}
            alt=""
            draggable={false}
            onPointerDown={(e) => onPointerDown(e, p)}
            className="absolute size-board-photo cursor-grab touch-none select-none rounded-12 object-cover shadow-card-sm active:cursor-grabbing"
            style={{ left: p.x, top: p.y }}
          />
        ))}
      </div>
      <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={add} />
    </main>
  );
}
