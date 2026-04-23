import type { Metadata } from "next";
import Sidebar from "../components/layout/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Support Ticket Classifier",
  description: "Premium MLOps dashboard for ticket classification and routing",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Sidebar />
        <div className="min-h-screen pt-16 lg:pl-64 lg:pt-0">
          <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
