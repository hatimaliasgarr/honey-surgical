"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username"));
    const password = String(formData.get("password"));

    // Simple credential check
    if (username === "admin" && password === "admin") {
      // Set a session cookie for the admin
      document.cookie = "admin_session=authenticated; path=/; max-age=86400; SameSite=Strict";
      router.push("/admin");
      return;
    }

    setLoading(false);
    setError("Invalid username or password. Please try again.");
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <form
          onSubmit={submit}
          className="rounded-2xl border border-border bg-white p-8 shadow-soft"
        >
          {/* Logo */}
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <Image
              src="/logo.jpeg"
              alt="HONEY SURGICALS Logo"
              width={80}
              height={80}
              className="rounded-xl object-contain"
              priority
            />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "#1A3A5C" }}>Admin Portal</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to manage the HONEY SURGICALS catalog
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="mb-6 border-t border-border" />

          {/* Fields */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                placeholder="Enter your username"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="mt-2 w-full" size="lg">
              <LogIn aria-hidden="true" />
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            {error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-center text-sm font-medium text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          {/* Footer note */}
          <p className="mt-6 text-center text-xs text-muted-foreground/60">
            Authorized personnel only &bull; HONEY SURGICALS Admin System
          </p>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground/50">
          <Link href="/" className="hover:text-primary transition-colors">← Back to website</Link>
        </p>
      </div>
    </div>
  );
}
