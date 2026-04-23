"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "../ThemeToggle";

const navItems = [
  { href: "/", label: "Submit", icon: "SB" },
  { href: "/review", label: "Review", icon: "RV" },
  { href: "/dashboard", label: "Dashboard", icon: "DB" },
  { href: "/routing", label: "Routing", icon: "RT" },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className="flex items-center gap-3 rounded-xl border-l-2 px-4 py-3 text-sm font-medium transition-all duration-200"
            style={
              isActive
                ? {
                    backgroundColor: "color-mix(in srgb, var(--accent-primary) 15%, transparent)",
                    color: "var(--accent-primary)",
                    borderLeftColor: "var(--accent-primary)",
                  }
                : {
                    color: "var(--text-secondary)",
                    borderLeftColor: "transparent",
                  }
            }
          >
            <span className="tabular-nums text-[10px]">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({ onNavClick }: { onNavClick?: () => void }) {
  return (
    <>
      <div className="px-5 py-5">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <div
              className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
              style={{
                background: "linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))",
                color: "white",
              }}
            >
              AI
            </div>
            <div>
              <div className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                TicketAI
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                ML Classifier
              </div>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="mb-4 border-t" style={{ borderColor: "var(--border)" }} />
        <NavLinks onClick={onNavClick} />
      </div>

      <div className="mt-auto px-5 pb-5">
        <div className="glass flex items-center gap-2 rounded-xl px-3 py-2 text-xs" style={{ color: "var(--text-secondary)" }}>
          <span className="pulse-dot inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--success)" }} />
          <span className="tabular-nums text-[10px]" style={{ color: "var(--success)" }}>
            UP
          </span>
          <span>Model Active</span>
        </div>
      </div>
    </>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header
        className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b px-4 lg:hidden"
        style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border)" }}
      >
        <button type="button" onClick={() => setOpen(true)} className="btn-ui btn-ghost h-9 w-9 p-0 text-xs" aria-label="Open sidebar">
          MN
        </button>
        <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          TicketAI Console
        </div>
        <ThemeToggle />
      </header>

      <aside
        className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r lg:flex"
        style={{ backgroundColor: "#0d0d14", borderColor: "var(--border)" }}
      >
        <SidebarBody />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar backdrop"
          />
          <aside
            className="relative z-10 flex h-full w-72 flex-col border-r"
            style={{ backgroundColor: "#0d0d14", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between px-4 py-4">
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Navigation
              </div>
              <button type="button" className="btn-ui btn-ghost h-9 w-9 p-0 text-xs" onClick={() => setOpen(false)} aria-label="Close sidebar">
                CL
              </button>
            </div>
            <SidebarBody onNavClick={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
