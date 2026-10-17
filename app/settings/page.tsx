"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Avatar from "@/components/settings/Avatar";
import ChangePasswordSheet from "@/components/settings/ChangePasswordSheet";
import {
  ButtonRow,
  LinkRow,
  SettingsCard,
  SettingsSection,
  StaticRow,
  StatusBadge,
  Toggle,
} from "@/components/settings/SettingsList";
import { logOut } from "@/lib/auth";
import { useMedia } from "@/lib/media";
import { setNotifications, useApp } from "@/lib/store";

// Figma "Settings - landing page". Header (back → home, search) comes from the shell.
// ?sheet=password opens the change-password sheet (also used by /_index).
function Settings() {
  const router = useRouter();
  const sheet = useSearchParams().get("sheet");
  const { user, cif, settings } = useApp();
  const { photo } = useMedia();

  const openSheet = () => router.replace("/settings?sheet=password", { scroll: false });
  const closeSheet = () => router.replace("/settings", { scroll: false });

  return (
    <main className="flex flex-col items-center px-32">
      <div className="mt-40">
        <Avatar name={user?.name ?? ""} photo={photo} badge={{ href: "/settings/personal" }} />
      </div>
      <p className="mt-12 text-center font-heading text-h2 text-black">{user?.name}</p>
      <p className="mt-2 text-center text-body-small text-ink-75">{user?.email}</p>

      <div className="mt-40 flex w-full flex-col gap-20">
        <SettingsSection title="General">
          <LinkRow
            first
            href="/settings/personal"
            icon="/icons/user-dark.svg"
            title="Personal details"
            subtitle="Name, email, phone"
          />
          <ButtonRow
            onClick={openSheet}
            icon="/icons/key.svg"
            title="Change password"
            subtitle="Keep your account secure"
          />
          <LinkRow
            href="/settings/life-area-images"
            icon="/icons/image.svg"
            title="Life area images"
            subtitle="Set up image which feels good for you"
          />
          {/* On by default; doesn't do anything yet. */}
          <StaticRow
            icon="/icons/bell-dark.svg"
            title="Notifications"
            subtitle="Reminders and updates"
            right={<Toggle checked={settings.notifications} onChange={setNotifications} label="Notifications" />}
          />
        </SettingsSection>

        <SettingsSection title="Contract & Payment">
          <StaticRow
            first
            icon="/icons/file-text.svg"
            title="Contract"
            subtitle="Sign with coach"
            right={
              cif.agreementSigned ? <StatusBadge label="Signed" /> : <StatusBadge label="Not signed" muted />
            }
          />
          {/* Payment status isn't in the store yet. */}
          <StaticRow
            icon="/icons/wallet.svg"
            title="Payment"
            subtitle="Payment for coaching"
            right={<StatusBadge label="Paid" />}
          />
        </SettingsSection>

        <SettingsCard>
          <ButtonRow onClick={logOut} icon="/icons/log-out.svg" tile="danger" title="Sign out" right={null} />
        </SettingsCard>
      </div>

      {sheet === "password" && <ChangePasswordSheet onClose={closeSheet} />}
    </main>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <Settings />
    </Suspense>
  );
}
