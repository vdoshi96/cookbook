import Link from "next/link";
import { MarkdownBlock } from "@/components/MarkdownBlock";
import { SearchBox } from "@/components/SearchBox";
import { getFrontMatter } from "@/lib/data";
import { cookWithPath } from "@/lib/routes";

export default function HomePage() {
  const frontMatter = getFrontMatter();

  return (
    <div className="page-shell home-page">
      <section className="home-hero">
        <p className="eyebrow">A digital companion</p>
        <h1 className="display-title">India Cookbook</h1>
        <p className="lede">
          Browse the cookbook by chapter, region, ingredient, and the cross-references that connect one dish to another.
        </p>
        <SearchBox />
      </section>

      <section className="page-section browse-entry-grid" aria-label="Browse the cookbook">
        <Link aria-label="Cook with what you have" className="browse-entry surface" href={cookWithPath()}>
          <p className="eyebrow">Cook with</p>
          <h2>Cook with what you have</h2>
          <p>Choose a few main ingredients and get recipes ranked by what you can make now.</p>
        </Link>
        <Link aria-label="Browse chapters" className="browse-entry surface" href="/chapters">
          <p className="eyebrow">Chapters</p>
          <h2>Browse chapters</h2>
          <p>Move through the cookbook by course and chapter, from chutneys and snacks to breads and desserts.</p>
        </Link>
        <Link aria-label="Browse regions" className="browse-entry surface" href="/regions">
          <p className="eyebrow">Regions</p>
          <h2>Browse regions</h2>
          <p>Follow dishes across Awadh, Tamil Nadu, Punjab, Kashmir, Bengal, and the wider regional map.</p>
        </Link>
      </section>

      <section className="page-section front-matter-rail surface" aria-labelledby="intro-heading">
        <p className="eyebrow">From the introduction</p>
        <h2 id="intro-heading">{frontMatter.introduction.title}</h2>
        <MarkdownBlock markdown={frontMatter.introduction.markdown} />
        <Link className="text-link" href="/about">
          Read the front matter
        </Link>
      </section>
    </div>
  );
}
