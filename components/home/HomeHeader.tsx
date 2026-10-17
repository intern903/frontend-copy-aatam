import Image from "next/image";
import Link from "next/link";
import { BOOKING_URL } from "@/lib/cif";

// Figma "Frame 366" on the Homepage: 329px wide at (32, 62), over the illustration.
// The avatar opens Settings; the phone books a call on zcal. The bell does nothing yet.
export default function HomeHeader({ name }: { name: string }) {
  return (
    <header className="absolute left-32 top-[62px] flex w-content items-center justify-between">
      <div className="flex items-center gap-8">
        <Link
          href="/settings"
          aria-label="Settings"
          className="flex size-avatar items-center justify-center rounded-pill bg-white/10"
        >
          <Image src="/icons/user.svg" alt="" width={32} height={32} />
        </Link>
        <p className="whitespace-nowrap font-heading text-h4 text-white">{name}</p>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex size-avatar items-center justify-center rounded-pill bg-white/10"
        >
          <Image src="/icons/bell.svg" alt="" width={24} height={24} />
          <span className="absolute right-16 top-[11px] size-8 rounded-pill bg-alert" />
        </button>
        {/* Books a call with Dinesh on zcal, in a new tab. */}
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Book a call with Dinesh"
          className="flex size-avatar items-center justify-center rounded-pill bg-white/10"
        >
          <Image src="/icons/phone-call.svg" alt="" width={24} height={24} />
        </a>
      </div>
    </header>
  );
}
