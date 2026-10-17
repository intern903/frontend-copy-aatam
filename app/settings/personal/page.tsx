"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Avatar from "@/components/settings/Avatar";
import { FieldLabel, FormActions, OutlineButton, TextField, fieldBoxClass, fieldInputClass } from "@/components/settings/Form";
import { setProfilePhoto, useMedia } from "@/lib/media";
import { updateUser, useApp } from "@/lib/store";

// Figma "Settings - personal details". Header (back → /settings) comes from the shell.
const COUNTRY_CODE = "+91";

export default function PersonalDetailsPage() {
  const router = useRouter();
  const { user } = useApp();
  const media = useMedia();
  const fileInput = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone?.number ?? "");
  // Photo is held in memory only (see lib/media.ts); it isn't saved across reloads.
  const [photo, setPhoto] = useState<string | null>(media.photo);

  const changed =
    name !== (user?.name ?? "") ||
    phone !== (user?.phone?.number ?? "") ||
    photo !== media.photo;
  const valid = name.trim() !== "";

  function choosePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photo && photo !== media.photo) URL.revokeObjectURL(photo);
    setPhoto(URL.createObjectURL(file));
    e.target.value = "";
  }

  function removePhoto() {
    if (photo && photo !== media.photo) URL.revokeObjectURL(photo);
    setPhoto(null);
  }

  function cancel() {
    if (photo && photo !== media.photo) URL.revokeObjectURL(photo);
    router.push("/settings");
  }

  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!changed || !valid) return;
    updateUser({
      name: name.trim(),
      phone: phone.trim() ? { code: COUNTRY_CODE, number: phone.trim() } : undefined,
    });
    setProfilePhoto(photo);
    router.push("/settings");
  }

  return (
    <main className="flex flex-col items-center px-32">
      <div className="mt-40">
        <Avatar name={name} photo={photo} badge={{ onClick: () => fileInput.current?.click() }} />
      </div>
      <div className="mt-20 flex gap-12">
        <OutlineButton icon="/icons/upload.svg" label="Upload Photo" onClick={() => fileInput.current?.click()} />
        <OutlineButton icon="/icons/delete.svg" label="Remove" onClick={removePhoto} />
      </div>
      <input ref={fileInput} type="file" accept="image/*" hidden onChange={choosePhoto} />

      <form onSubmit={save} className="mt-40 flex w-full flex-col gap-20">
        <div className="flex flex-col gap-12">
          <TextField
            label="Name"
            required
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="Email"
            required
            type="email"
            name="email"
            autoComplete="email"
            // The email is the account's sign-in, so it can't be changed here.
            value={user?.email ?? ""}
            readOnly
            aria-readonly
            className={`${fieldInputClass} cursor-not-allowed text-ink-50`}
          />
          <label className="flex w-full flex-col gap-4">
            <FieldLabel label="Phone" />
            <span className={`${fieldBoxClass} gap-4`}>
              <span className={phone ? "text-black" : "text-ink-50"}>{COUNTRY_CODE}</span>
              <input
                type="tel"
                inputMode="tel"
                name="phone"
                autoComplete="tel-national"
                placeholder="----- -----"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={fieldInputClass}
              />
            </span>
          </label>
        </div>
        <FormActions onCancel={cancel} saveDisabled={!changed || !valid} />
      </form>
    </main>
  );
}
