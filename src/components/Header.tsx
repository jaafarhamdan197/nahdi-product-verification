import { ReactNode } from "react";

/**
 * Black topbar (structural chrome per design.md). The Nahdi wordmark is dark
 * teal, so each logo sits on a white chip to stay legible on black.
 * Nahdi (client) leads on the left; Initiative (agency) on the right.
 */
export default function Header({ right }: { right?: ReactNode }) {
  return (
    <header className="topbar">
      <div className="logo-chip">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/nahdi_online_logo.png"
          alt="Nahdi Online"
          style={{ height: 34 }}
        />
      </div>

      <div className="flex items-center gap-4">
        {right}
        <div className="logo-chip">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/Initiative_agency_logo.png"
            alt="Initiative"
            style={{ height: 24 }}
          />
        </div>
      </div>
    </header>
  );
}
