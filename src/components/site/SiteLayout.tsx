import type { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MobileNav from "./MobileNav";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-canvas">
      <Navbar />
      {/* Bottom padding on mobile leaves room for the fixed MobileNav bar */}
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileNav />
    </div>
  );
}
