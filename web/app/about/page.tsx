import type { Metadata } from "next";
import { MarkdownBlock } from "@/components/MarkdownBlock";
import { getFrontMatter } from "@/lib/data";

export const metadata: Metadata = {
  title: "About"
};

export default function AboutPage() {
  const frontMatter = getFrontMatter();
  const sections = [frontMatter.introduction, frontMatter.history, frontMatter.notes_on_recipes];

  return (
    <div className="page-shell reading-page">
      <p className="eyebrow">Front matter</p>
      <h1 className="section-title">About the Cookbook</h1>
      {sections.map((section) => (
        <section className="reading-section surface" key={section.title}>
          <h2>{section.title}</h2>
          <MarkdownBlock markdown={section.markdown} />
        </section>
      ))}
    </div>
  );
}
