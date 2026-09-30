import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Store, Sprout, Bell, LayoutGrid } from "lucide-react";
import { useLang } from "@/lib/i18n";

const items = [
  { to: "/", icon: Home, key: "home", end: true },
  { to: "/market-price", icon: Store, key: "market", end: false },
  { to: "/crop-recommendation", icon: Sprout, key: "crops", end: false },
  { to: "/alerts", icon: Bell, key: "alerts", end: false },
  { to: "/more", icon: LayoutGrid, key: "more", end: false },
];

export default function BottomNav() {
  const { t } = useLang();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-card border-t border-border">
      <div className="max-w-md mx-auto grid grid-cols-5">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-2.5 tap-target transition-colors ${
                isActive ? "text-accent" : "text-muted-foreground"
              }`
            }
          >
            <it.icon size={24} strokeWidth={2.2} />
            <span className="text-[10px] font-semibold">{t(it.key)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}