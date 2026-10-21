import Image from "next/image";

// Figma Login / Password Setup: white 329px card, logo, heading + subtitle, then the form.
// Figma's "Hey, There!" is too chatty for the tone the BRD asks for; "Welcome" is warm and plain.
export default function AuthCard({
  subtitle,
  children,
  onSubmit,
}: {
  subtitle?: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex w-content flex-col items-center gap-24 rounded-12 bg-white p-24"
    >
      <div className="relative size-logo overflow-hidden">
        {/* Crop of the 500px logo exactly as placed in Figma */}
        <Image
          src="/images/aatam-logo.png"
          alt="Aatam — The Bridge to I"
          width={500}
          height={500}
          priority
          className="absolute left-[-12.11%] top-[-11.8%] w-[124.22%] max-w-none"
        />
      </div>
      <div className="flex w-full flex-col items-center gap-4 text-center text-ink-brown">
        <h1 className="font-heading text-h1">Welcome</h1>
        {subtitle && <p className="text-body-small">{subtitle}</p>}
      </div>
      {children}
    </form>
  );
}
