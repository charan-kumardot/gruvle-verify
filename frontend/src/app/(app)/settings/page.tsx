"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { deleteAccount, getProfile, updateProfile } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const INTERESTS = ["Products", "Websites", "Claims", "Documents", "Listings", "Messages", "Everything"];

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    getProfile().then((p) => setInterests(p.verification_interests));
  }, []);

  function toggle(interest: string) {
    setInterests((prev) => (prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]));
    setSaved(false);
  }

  async function save() {
    await updateProfile({ verification_interests: interests });
    setSaved(true);
  }

  async function handlePasswordReset() {
    if (!email) return;
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    });
    alert("Password reset email sent.");
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      const supabase = createClient();
      // scope: "local" — the account (and its session) no longer exists server-side
      // at this point, so the default global sign-out would call Supabase's logout
      // endpoint with a now-invalid token and get a harmless-but-noisy 403. Clearing
      // the local session is all that's needed here.
      await supabase.auth.signOut({ scope: "local" });
      router.push("/");
      router.refresh();
    } catch {
      setDeleteError("Couldn't delete your account — please try again, or contact support.");
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Account</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted">Email</p>
            <p className="text-sm font-medium">{email}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handlePasswordReset}>
            Send password reset email
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Appearance</h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Theme</p>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Verification interests</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {INTERESTS.map((interest) => (
              <button
                key={interest}
                onClick={() => toggle(interest)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors",
                  interests.includes(interest)
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border hover:bg-accent-soft",
                )}
              >
                {interest}
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button size="sm" onClick={save}>
              Save
            </Button>
            {saved && <span className="text-sm text-verified">Saved</span>}
          </div>
        </CardContent>
      </Card>

      <Card className="border-contradicted/20">
        <CardHeader>
          <h2 className="text-sm font-semibold text-contradicted">Danger zone</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all associated verifications, saved
            reports, notes, and watchlist items. This can&apos;t be undone.
          </p>
          {deleteError && <p className="mt-2 text-sm text-contradicted">{deleteError}</p>}
          <div className="mt-4">
            {!confirmingDelete ? (
              <Button variant="danger" size="sm" onClick={() => setConfirmingDelete(true)}>
                Delete account
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="danger" size="sm" onClick={handleDeleteAccount} disabled={deleting}>
                  {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {deleting ? "Deleting…" : "Yes, permanently delete my account"}
                </Button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
