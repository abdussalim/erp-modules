"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Sidebar link that highlights itself when it is the current page
export default function NavLink({ href, label }: { href: string; label: string }) {
  const active = usePathname() === href;
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 ${active ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}
    >
      {label}
    </Link>
  );
}
