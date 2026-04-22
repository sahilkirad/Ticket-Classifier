// explanation about why those changes were done.
// Creates a shared layout shell and keeps all page rendering consistent.

// Internal working of code
// Every page is rendered inside this root layout, with global navbar and main container.
import type { Metadata } from "next";
import Navbar from "../components/Navbar";

export const metadata: Metadata = {
  title: "AI Support Ticket Classifier",
  description: "Project frontend for ticket classification and routing",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
