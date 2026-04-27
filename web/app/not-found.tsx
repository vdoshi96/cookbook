import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell empty-state">
      <p className="eyebrow">Not found</p>
      <h1 className="section-title">No matching page</h1>
      <p className="lede">No matches yet. Try a region, ingredient, or technique.</p>
      <Link className="text-link" href="/search">
        Search the cookbook
      </Link>
    </div>
  );
}
