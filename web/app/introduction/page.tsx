import type { Metadata } from "next";
import { MarkdownBlock } from "@/components/MarkdownBlock";
import { getFrontMatter } from "@/lib/data";

export const metadata: Metadata = {
  title: "Introduction"
};

export default function IntroductionPage() {
  const { introduction } = getFrontMatter();

  return (
    <div className="page-shell reading-page">
      <p className="eyebrow">Front matter</p>
      <h1 className="section-title">{introduction.title}</h1>
      <section className="reading-section surface">
        <MarkdownBlock markdown={introduction.markdown} />
      </section>
    </div>
  );
}
