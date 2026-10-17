import Image from "next/image";

// Settings form pieces (Figma Personal Details / Change Password):
// Body Medium label with a 50% "*" for required, white 12px-radius field with a
// 0.5px Background/600 border, Body Small text; Cancel / Save pair at the bottom.

export function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <span className="text-body-medium text-black">
      {label}
      {required && <span className="text-ink-50"> *</span>}
    </span>
  );
}

export const fieldBoxClass =
  "flex w-full items-center rounded-12 border-hairline border-background-600 bg-white p-12 text-body-small";

export const fieldInputClass =
  "min-w-0 flex-1 bg-transparent text-body-small text-black outline-none placeholder:text-ink-50";

export function TextField({
  label,
  required,
  error,
  ...input
}: { label: string; required?: boolean; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex w-full flex-col gap-4">
      <FieldLabel label={label} required={required} />
      <span className={fieldBoxClass}>
        <input required={required} aria-invalid={!!error} className={fieldInputClass} {...input} />
      </span>
      {error && (
        <span role="alert" className="text-caption text-danger">
          {error}
        </span>
      )}
    </label>
  );
}

export function FormActions({
  onCancel,
  saveDisabled,
}: {
  onCancel: () => void;
  saveDisabled: boolean;
}) {
  return (
    <div className="flex w-full gap-8">
      <button
        type="button"
        onClick={onCancel}
        className="flex flex-1 items-center justify-center rounded-8 bg-cancel py-16 text-button-cta text-cancel-text"
      >
        Cancel
      </button>
      {/* Disabled look isn't in Figma: the same button at half opacity. */}
      <button
        type="submit"
        disabled={saveDisabled}
        className="flex flex-1 items-center justify-center rounded-8 bg-primary-600 py-16 text-button-cta text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Save
      </button>
    </div>
  );
}

// Outlined button with a 16px icon (Upload Photo / Remove / Reset to default).
export function OutlineButton({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-8 whitespace-nowrap rounded-8 border border-background-600 px-16 py-12 text-button-cta text-black"
    >
      <Image src={icon} alt="" width={16} height={16} />
      {label}
    </button>
  );
}
