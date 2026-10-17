"use client";

import { FloatingBack } from "@/components/shell/BackButton";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import AuthCard from "@/components/auth/AuthCard";
import AuthField, { AuthError, AuthSubmit } from "@/components/auth/AuthField";
import { createToken, saveToken } from "@/lib/auth";
import { signIn, useApp } from "@/lib/store";

// Figma "Reset Password". Reached from the Check Mail card with ?email=…
// Login accepts any password, so a reset just checks the two match, saves the new one
// (for Change Password in Settings) and signs in.
function ResetPassword() {
  const router = useRouter();
  const email = useSearchParams().get("email") ?? "";
  const { user } = useApp();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<"mismatch" | "unknown" | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirm) {
      setError("mismatch");
      return;
    }
    if (!user || user.email.toLowerCase() !== email.toLowerCase()) {
      setError("unknown");
      return;
    }
    const token = createToken({ email: user.email, name: user.name });
    saveToken(token);
    signIn({ ...user, token, password });
    router.replace("/");
  }

  return (
    <main className="pt-signup-top">
      <FloatingBack />
      <AuthCard subtitle="Reset my password" onSubmit={handleSubmit}>
        <AuthField
          label="Enter My Password"
          placeholder="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            setError(null);
          }}
        />
        <AuthField
          label="Re-enter My Password"
          placeholder="Password"
          type="password"
          name="confirm"
          autoComplete="new-password"
          value={confirm}
          onChange={(v) => {
            setConfirm(v);
            setError(null);
          }}
        />
        {error === "mismatch" && <AuthError>The two passwords don’t match.</AuthError>}
        {error === "unknown" && (
          <AuthError>
            We couldn’t find an account for {email || "this link"}.{" "}
            <Link href="/signup" className="underline">
              Create one
            </Link>
          </AuthError>
        )}
        <AuthSubmit />
      </AuthCard>
    </main>
  );
}

export default function ResetPasswordPage() {
  // useSearchParams needs a Suspense boundary in the app router.
  return (
    <Suspense>
      <ResetPassword />
    </Suspense>
  );
}
