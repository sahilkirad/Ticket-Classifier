// explanation about why those changes were done.
// Adds simple global navigation to move across the 4 pages quickly.

// Internal working of code
// A static links array is rendered into Next.js Link buttons in a top nav bar

import Link from "next/link";

const links = [
  { href: "/", label: "Submit" },
  { href: "/review", label: "Review" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/routing", label: "Routing" },
];

export default function Navbar() {
  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <div className="font-semibold">Ticket Classifier</div>
        <div className="ml-auto flex gap-2">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md border px-3 py-1 text-sm hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
