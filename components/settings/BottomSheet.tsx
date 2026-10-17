import PopUpSheet from "@/components/PopUpSheet";

// Settings pop-ups (Figma "Settings - change password" / "Health image") are the shared
// PopUpSheet in its bottom variant.
export default function BottomSheet(props: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <PopUpSheet {...props} variant="bottom" />;
}
