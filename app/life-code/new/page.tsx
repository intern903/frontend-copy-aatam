"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import LifeCodeFlow from "@/components/life-code/LifeCodeFlow";
import { useHydrated } from "@/components/values/ui";
import type { LifeCodeSource } from "@/lib/data";
import { addLifeCode, updateLifeCode, useApp } from "@/lib/store";

// Figma "RG - Guide" (New Life Code / Edit Life Code): the five-step flow in components/life-code.
//   /life-code/new                      added by hand
//   /life-code/new?edit=<id>            edit one (all fields on one screen, filled in)
//   /life-code/new?source=My%20Outcomes&period=<id>&return=<path>
//                                       from the close of a period: tagged with that source and
//                                       period, then back to where the client was.
// Saved to store.lifeCodes.
const SOURCES: LifeCodeSource[] = ["My Outcomes", "My Well-Being", "Session", "My Vision", "Added by hand", "Chat"];

export default function NewLifeCodePage() {
  return (
    <Suspense>
      <NewLifeCode />
    </Suspense>
  );
}

function NewLifeCode() {
  const router = useRouter();
  const params = useSearchParams();
  const hydrated = useHydrated();
  const codes = useApp().lifeCodes;
  const editing = codes.find((c) => c.id === params.get("edit"));
  const source = SOURCES.find((s) => s === params.get("source")) ?? "Added by hand";
  const back = params.get("return")?.startsWith("/") ? params.get("return")! : null;

  if (!hydrated) return null;

  return (
    <LifeCodeFlow
      key={editing?.id ?? "new"}
      title={editing ? "Edit Life Code" : "New Life Code"}
      initial={editing}
      edit={!!editing}
      onCancel={() => router.push(back ?? (editing ? `/life-code/${editing.id}` : "/life-code"))}
      onSave={(input) => {
        if (editing) {
          updateLifeCode(editing.id, input);
          router.push(`/life-code/${editing.id}`);
          return;
        }
        const id = addLifeCode(input, source, params.get("period"));
        router.push(back ?? `/life-code/${id}`);
      }}
    />
  );
}
