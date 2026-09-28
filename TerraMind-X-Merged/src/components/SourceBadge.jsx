import React from "react";
import { Circle } from "lucide-react";

export default function SourceBadge({ source, time, stale }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <Circle size={7} className={stale ? "fill-amber-500 text-amber-500" : "fill-green-500 text-green-500"} />
      <span>{source}</span>
      <span className="text-border">•</span>
      <span>{time}{stale ? " (stale)" : ""}</span>
    </div>
  );
}