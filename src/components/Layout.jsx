import React from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import VoiceMic from "@/components/VoiceMic";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative">
      <main className="min-h-screen pb-24">
        <Outlet />
      </main>
      <BottomNav />
      <VoiceMic />
    </div>
  );
}