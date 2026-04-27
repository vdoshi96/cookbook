import ReactMarkdown from "react-markdown";

export function MarkdownBlock({ markdown }: { markdown: string }) {
  return (
    <div className="markdown-block">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
