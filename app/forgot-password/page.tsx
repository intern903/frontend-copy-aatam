"use client";

import { FloatingBack } from "@/components/shell/BackButton";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthCard from "@/components/auth/AuthCard";
import AuthField, { AuthSubmit } from "@/components/auth/AuthField";

// Figma "Forgot Password", then "Check Mail" on top of it once the email is sent.
// No email is really sent: tapping the Check Mail card stands in for opening the reset link.
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function openResetLink() {
    router.push(`/reset-password?email=${encodeURIComponent(email.trim())}`);
  }

  return (
    <main className="relative min-h-frame pt-forgot-top">
      <FloatingBack />
      <AuthCard
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
        }}
      >
        <AuthField
          label="Email"
          placeholder="Enter your email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
        />
        <AuthSubmit label="Reset Password" />
      </AuthCard>

      {sent && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            type="button"
            onClick={openResetLink}
            aria-label="Open the password reset link"
            className="flex w-content flex-col items-center justify-center gap-20 rounded-16 bg-background p-check-mail"
          >
            <Image src="/icons/check-circle.svg" alt="" width={60} height={60} />
            <p role="status" className="text-center text-body-large text-black">
              Please check your mail inbox for password reset link!
            </p>
          </button>
        </div>
      )}
    </main>
  );
}
