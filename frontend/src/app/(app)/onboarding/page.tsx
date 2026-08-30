"use client";

import { Button } from "@/components/ui/Button";
import { updateProfile } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

const INTERESTS = ["Products", "Websites", "Claims", "Documents", "Listings", "Messages", "Everything"];
const METHODS = [
  "I search around and compare a few sources myself",
  "I ask friends or communities",
  "I usually just trust my instinct",
  "I don't have a consistent method",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [interests, setInterests] = useState<string[]>([]);
  const [method, setMethod] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleInterest(value: string) {
    setInterests((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  async function finish(completed: boolean) {
    setSaving(true);
    try {
      await updateProfile({
        verification_interests: interests,
        usual_verification_method: method,
        onboarding_completed: completed,
      });
    } finally {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-lg py-8">
      {step === 1 && (
        <div>
          <h1 className="text-2xl font-semibold">What do you want to verify?</h1>
          <p className="mt-1 text-sm text-muted-foreground">Pick as many as apply.</p>
          <div className="mt-6 grid grid-cols-2 gap-2.5">
            {INTERESTS.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={cn(
                  "rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors",
                  interests.includes(interest)
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border hover:bg-accent-soft",
                )}
              >
                {interest}
              </button>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-between">
            <button onClick={() => finish(false)} className="text-sm text-muted-foreground hover:text-foreground">
              Skip for now
            </button>
            <Button onClick={() => setStep(2)} disabled={interests.length === 0}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 className="text-2xl font-semibold">How do you usually verify information?</h1>
          <p className="mt-1 text-sm text-muted-foreground">Optional — helps us tailor suggestions.</p>
          <div className="mt-6 space-y-2.5">
            {METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={cn(
                  "block w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors",
                  method === m ? "border-accent bg-accent-soft text-accent" : "border-border hover:bg-accent-soft",
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-between">
            <button onClick={() => finish(true)} className="text-sm text-muted-foreground hover:text-foreground">
              Skip
            </button>
            <Button onClick={() => finish(true)} disabled={saving}>
              {saving ? "Saving…" : "Finish"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
