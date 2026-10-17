"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import AuthCard from "@/components/auth/AuthCard";
import AuthField, { AuthSubmit } from "@/components/auth/AuthField";
import { createToken, saveToken } from "@/lib/auth";
import { DEMO_FULL_EMAIL, DEMO_NEW_EMAIL, demoFullAccount, demoNewAccount } from "@/lib/demo-data";
import { loadDemoAccount, signIn, useApp } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { user } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  // The two fixed demo accounts (lib/demo-data.ts): sign straight in, replacing whatever this
  // browser had saved. Typing either email in the form does the same, with any password.
  function signInDemo(kind: "full" | "new") {
    const account = kind === "full" ? demoFullAccount.user : demoNewAccount.user;
    const token = createToken(account);
    loadDemoAccount(kind, token);
    saveToken(token);
    router.replace("/");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const typed = email.trim().toLowerCase();
    if (typed === DEMO_FULL_EMAIL) return signInDemo("full");
    if (typed === DEMO_NEW_EMAIL) return signInDemo("new");
    // Any password is accepted; only the email has to match the saved user.
    if (!user || user.email.toLowerCase() !== email.trim().toLowerCase()) {
      setError(true);
      emailRef.current?.focus();
      return;
    }
    const token = createToken({ email: user.email, name: user.name });
    saveToken(token);
    // An account without a saved password (the sample client) takes the first one used,
    // so Change Password has something to check against.
    signIn({ ...user, token, password: user.password ?? password });
    router.replace("/");
  }

  return (
    <main className="pt-login-top">
      <AuthCard subtitle="Gateway to your Life Operating System" onSubmit={handleSubmit}>
        <div className="flex w-full flex-col gap-16">
          <AuthField
            label="Email"
            placeholder="Enter your email"
            type="email"
            name="email"
            autoComplete="email"
            ref={emailRef}
            error={
              error ? (
                <>
              We couldn’t find an account with that email.{" "}
              <Link href="/signup" className="underline">
                Create one
              </Link>
                </>
              ) : undefined
            }
            value={email}
            onChange={(v) => {
              setEmail(v);
              setError(false);
            }}
          />
          <div className="flex w-full flex-col gap-12">
            <AuthField
              label="Password"
              placeholder="Enter your password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
            />
            <div className="flex w-full items-center justify-between text-caption-lg text-ink-brown">
              <label className="flex items-center gap-8">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="size-16 appearance-none rounded-2 border-hairline border-ink-muted bg-background shadow-input-inset checked:bg-primary-600"
                />
                Remember me
              </label>
              <Link href="/forgot-password">Forgot Password</Link>
            </div>
          </div>
        </div>
        <AuthSubmit />
      </AuthCard>
      {/* Not in Figma: demo sign-in for presentations. */}
      <div className="mx-auto mt-16 flex w-content gap-8">
        <button type="button" onClick={() => signInDemo("full")} className="flex-1 rounded-8 border border-primary-600 py-8 text-caption-lg text-primary-600">
          Demo — full account
        </button>
        <button type="button" onClick={() => signInDemo("new")} className="flex-1 rounded-8 border border-primary-600 py-8 text-caption-lg text-primary-600">
          Demo — new client
        </button>
      </div>
    </main>
  );
}
