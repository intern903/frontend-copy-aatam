import Image from "next/image";
import Link from "next/link";

export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// Figma Settings avatar: 120px circle, Background/300 with a Background/600 border,
// photo or initials (Poppins 64), and a 24px camera badge at (92, 92).
export default function Avatar({
  name,
  photo,
  badge,
}: {
  name: string;
  photo: string | null;
  badge: { href: string } | { onClick: () => void };
}) {
  const badgeClass =
    "absolute left-[92px] top-[92px] flex size-icon items-center justify-center rounded-pill bg-background-600";
  const badgeIcon = <Image src="/icons/camera.svg" alt="" width={12} height={12} />;

  return (
    <div className="relative size-avatar-lg">
      <div className="flex size-avatar-lg items-center justify-center overflow-hidden rounded-pill border border-background-600 bg-background-300">
        {photo ? (
          // Device photo held as an object URL, so next/image can't optimise it.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="size-full object-cover" />
        ) : (
          <span className="font-heading text-avatar-initials text-black">{initials(name)}</span>
        )}
      </div>
      {"href" in badge ? (
        <Link href={badge.href} aria-label="Edit photo" className={badgeClass}>
          {badgeIcon}
        </Link>
      ) : (
        <button type="button" aria-label="Change photo" onClick={badge.onClick} className={badgeClass}>
          {badgeIcon}
        </button>
      )}
    </div>
  );
}
