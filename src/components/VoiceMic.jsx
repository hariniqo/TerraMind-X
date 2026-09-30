import { Mic } from "lucide-react";

export default function VoiceMic() {
	return (
		<button
			type="button"
			disabled
			aria-label="Voice input is not available yet"
			title="Voice input is not available yet"
			className="fixed bottom-24 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-app-surface text-white/50 shadow-lg disabled:cursor-not-allowed"
		>
			<Mic className="h-5 w-5" aria-hidden="true" />
		</button>
	);
}