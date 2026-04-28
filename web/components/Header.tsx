import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="site-header">
      <Link className="brand" href="/">
        India Cookbook
      </Link>
      <nav className="primary-nav" aria-label="Primary navigation">
        <Link href="/">Home</Link>
        <Link href="/chapters">Chapters</Link>
        <Link href="/regions">Regions</Link>
        <Link href="/search">Search</Link>
        <Link href="/about">About</Link>
      </nav>
      <div className="header-actions">
        <ThemeToggle />
      </div>
    </header>
  );
}
