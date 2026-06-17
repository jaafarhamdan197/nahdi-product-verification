import { ReactNode } from "react";

/**
 * White brand bar serving as the page header. Nahdi (client) sits to the left
 * of the title; Initiative (agency) on the far right. On white both logos read
 * without the chips the previous black topbar required.
 */
export default function Header({
  title = "Product Verification",
  subtitle,
  right,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="brandbar">
      <div className="brand-left">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/nahdi_online_logo.png"
          alt="Nahdi Online"
          className="brand-logo"
          style={{ height: 40 }}
        />
        <span className="brand-divider" />
        <div className="min-w-0">
          <h1 className="sec-hdr">{title}</h1>
          {subtitle && <p className="brand-sub">{subtitle}</p>}
        </div>
      </div>

      <div className="brand-right">
        {right}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/Initiative_agency_logo.png"
          alt="Initiative"
          className="brand-logo"
          style={{ height: 26 }}
        />
      </div>
    </header>
  );
}
