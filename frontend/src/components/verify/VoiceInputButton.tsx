"use client";

import { ApiError, transcribeAudio } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Loader2, Mic, Square } from "lucide-react";
import { useRef, useState } from "react";

type RecordingState = "idle" | "recording" | "transcribing";

export function VoiceInputButton({
  onTranscribed,
  className,
}: {
  onTranscribed: (text: string) => void;
  className?: string;
}) {
  const [state, setState] = useState<RecordingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = handleStop;
      recorder.start();
      setState("recording");
    } catch {
      setError("Microphone access was denied or is unavailable.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }

  async function handleStop() {
    setState("transcribing");
    const blob = new Blob(chunksRef.current, { type: mediaRecorderRef.current?.mimeType || "audio/webm" });
    try {
      const { text } = await transcribeAudio(blob);
      onTranscribed(text);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't transcribe that recording — please try again.");
    } finally {
      setState("idle");
    }
  }

  function handleClick() {
    if (state === "idle") startRecording();
    else if (state === "recording") stopRecording();
  }

  return (
    <div className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "transcribing"}
        aria-label={state === "recording" ? "Stop recording" : "Record a voice claim"}
        title={state === "recording" ? "Stop recording" : "Speak instead of typing"}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
          state === "recording"
            ? "border-contradicted/30 bg-contradicted-soft text-contradicted animate-pulse"
            : "border-border text-muted-foreground hover:bg-accent-soft hover:text-foreground",
          className,
        )}
      >
        {state === "transcribing" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : state === "recording" ? (
          <Square className="h-3.5 w-3.5 fill-current" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </button>
      {error && <p className="mt-1 text-xs text-contradicted">{error}</p>}
    </div>
  );
}
