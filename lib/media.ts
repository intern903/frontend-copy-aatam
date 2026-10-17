"use client";

// Images picked from the device, held in memory as URL.createObjectURL links.
// Prototype only: these are NOT saved — after a reload the profile photo falls back to
// initials and every life area falls back to its default image (lib/data.ts).

import { useSyncExternalStore } from "react";
import type { LifeAreaId } from "./data";

type Media = { photo: string | null; areas: Partial<Record<LifeAreaId, string>> };

let media: Media = { photo: null, areas: {} };
const listeners = new Set<() => void>();
const empty: Media = { photo: null, areas: {} };

function set(next: Media) {
  media = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useMedia() {
  return useSyncExternalStore(subscribe, () => media, () => empty);
}

export function setProfilePhoto(url: string | null) {
  if (media.photo && media.photo !== url) URL.revokeObjectURL(media.photo);
  set({ ...media, photo: url });
}

export function setAreaImage(id: LifeAreaId, url: string | null) {
  const previous = media.areas[id];
  if (previous && previous !== url) URL.revokeObjectURL(previous);
  const areas = { ...media.areas };
  if (url) areas[id] = url;
  else delete areas[id];
  set({ ...media, areas });
}
