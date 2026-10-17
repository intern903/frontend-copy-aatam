import Image from "next/image";
import Link from "next/link";

// Figma Settings landing: a section label over a white 24px-radius card of rows,
// split by 0.5px black/25% dividers. Each row: 40px icon tile, Body title,
// Caption subtitle, and a chevron / toggle / badge on the right.

export function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex w-full flex-col gap-12">
      <h2 className="text-body-medium text-black">{title}</h2>
      <SettingsCard>{children}</SettingsCard>
    </section>
  );
}

export function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-24 bg-white [&>*+*]:border-t-hairline [&>*+*]:border-ink-25">
      {children}
    </div>
  );
}

type RowProps = {
  icon: string;
  title: string;
  subtitle?: string;
  tile?: "default" | "danger";
  right?: React.ReactNode;
  first?: boolean; // the first row in each Figma card is padded 16px on top
};

function RowContent({ icon, title, subtitle, tile = "default", right }: RowProps) {
  return (
    <>
      <span className="flex min-w-0 flex-1 items-start gap-12 text-left">
        <span
          className={`flex size-icon-button shrink-0 items-center justify-center rounded-12 ${
            tile === "danger" ? "bg-danger" : "bg-background"
          }`}
        >
          <Image src={icon} alt="" width={24} height={24} />
        </span>
        <span className="flex min-w-0 flex-col gap-2">
          <span className="text-body text-black">{title}</span>
          {subtitle && <span className="text-caption text-ink-50">{subtitle}</span>}
        </span>
      </span>
      {right}
    </>
  );
}

const rowClass = (first?: boolean) =>
  `flex w-full items-center justify-between gap-8 px-16 ${first ? "pb-12 pt-16" : "py-12"}`;

export const Chevron = () => <Image src="/icons/chevron-right.svg" alt="" width={24} height={24} />;

export function LinkRow({ href, ...props }: RowProps & { href: string }) {
  return (
    <Link href={href} className={rowClass(props.first)}>
      <RowContent {...props} right={<Chevron />} />
    </Link>
  );
}

export function ButtonRow({ onClick, ...props }: RowProps & { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={rowClass(props.first)}>
      <RowContent {...props} right={props.right === undefined ? <Chevron /> : props.right} />
    </button>
  );
}

export function StaticRow(props: RowProps) {
  return (
    <div className={rowClass(props.first)}>
      <RowContent {...props} />
    </div>
  );
}

// Read-only status pill (Primary/500, Caption white).
export function StatusBadge({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <span
      className={`shrink-0 whitespace-nowrap rounded-pill px-12 py-4 text-caption ${
        muted ? "bg-background-600 text-black" : "bg-primary-500 text-white"
      }`}
    >
      {label}
    </span>
  );
}

// 40 × 20 switch. Figma only shows "on" (Primary/500, knob right); "off" uses Background/600.
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-toggle w-toggle shrink-0 rounded-pill border-hairline ${
        checked ? "border-primary-500 bg-primary-500" : "border-background-600 bg-background-600"
      }`}
    >
      <span
        className={`absolute top-1/2 size-toggle-knob -translate-y-1/2 rounded-pill bg-white transition-[left] ${
          checked ? "left-[20px]" : "left-[1px]"
        }`}
      />
    </button>
  );
}
