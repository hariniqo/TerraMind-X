import { Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function VoiceAssistant() {
  const navigate = useNavigate();

  return (
    <main className="mx-auto min-h-screen max-w-md bg-app-bg px-5 py-10 text-white">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-10 text-sm text-white/70 hover:text-white"
      >
        Back
      </button>
      <section className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <Mic className="mb-5 h-10 w-10 text-white/50" aria-hidden="true" />
        <h1 className="text-xl font-bold">Voice assistant</h1>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">
          Voice input and spoken responses are not available in this build.
        </p>
      </section>
    </main>
  );
}