"use client";

import { useEffect, useState } from "react";
import { setPassword, useApp } from "@/lib/store";
import BottomSheet from "./BottomSheet";
import { FormActions, TextField } from "./Form";

// Simulated: the "current password" is checked against the one saved at sign-up / reset /
// first login (lib/store.ts). Figma's stray wallet icon inside the first field is left out.
export default function ChangePasswordSheet({ onClose }: { onClose: () => void }) {
  const { user } = useApp();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [wrong, setWrong] = useState(false);
  const [saved, setSaved] = useState(false);

  const ready = current !== "" && next !== "" && confirm !== "" && next === confirm;

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(onClose, 1200);
    return () => clearTimeout(timer);
  }, [saved, onClose]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!ready) return;
    // A session from before passwords were saved has none to check, so it accepts the first one typed.
    if (user?.password !== undefined && current !== user.password) {
      setWrong(true);
      return;
    }
    setPassword(next);
    setSaved(true);
  }

  return (
    <BottomSheet title="Change Password" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-16">
        <fieldset disabled={saved} className="flex flex-col gap-12">
          <TextField
            label="Current Password"
            required
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => {
              setCurrent(e.target.value);
              setWrong(false);
            }}
            error={wrong ? "Wrong credentials" : undefined}
          />
          <TextField
            label="New Password"
            required
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
          <TextField
            label="Confirm New Password"
            required
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </fieldset>
        {/* Success message isn't in Figma: a short Caption line before the sheet closes. */}
        {saved && (
          <p role="status" className="text-caption text-primary-600">
            Password changed
          </p>
        )}
        <FormActions onCancel={onClose} saveDisabled={!ready || saved} />
      </form>
    </BottomSheet>
  );
}
