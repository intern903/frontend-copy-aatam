"use client";

import { FloatingBack } from "@/components/shell/BackButton";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import AuthCard from "@/components/auth/AuthCard";
import AuthField, { AuthSubmit } from "@/components/auth/AuthField";
import { createToken, saveToken } from "@/lib/auth";
import { signIn } from "@/lib/store";

// Figma "Password Setup", with Name and Email fields added in the Login field style.
export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mismatch, setMismatch] = useState(false);
  const confirmRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirm) {
      setMismatch(true);
      confirmRef.current?.focus();
      return;
    }
    const user = { name: name.trim(), email: email.trim() };
    const token = createToken(user);
    saveToken(token);
    signIn({ ...user, token, password });
    router.replace("/");
  }

  return (
    <main className="pt-signup-top">
      <FloatingBack />
      <AuthCard subtitle="Set my password" onSubmit={handleSubmit}>
        <AuthField
          label="Name"
          placeholder="Enter your name"
          type="text"
          name="name"
          autoComplete="name"
          value={name}
          onChange={setName}
        />
        <AuthField
          label="Email"
          placeholder="Enter your email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
        />
        <AuthField
          label="Enter My Password"
          placeholder="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            setMismatch(false);
          }}
        />
        <AuthField
          label="Re-enter My Password"
          placeholder="Password"
          type="password"
          name="confirm"
          autoComplete="new-password"
          ref={confirmRef}
          error={mismatch ? "The two passwords don’t match." : undefined}
          value={confirm}
          onChange={(v) => {
            setConfirm(v);
            setMismatch(false);
          }}
        />
        <AuthSubmit />
      </AuthCard>
    </main>
  );
}
