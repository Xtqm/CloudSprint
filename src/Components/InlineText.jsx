import { ExternalLink } from 'lucide-react';

function InlineText({ text }) {
  // Split on both backtick code spans and markdown links
  // Captures: `code`, [label](url)
  const parts = text.split(/(`[^`]+`|\[[^\]]+\]\([^)]+\))/g);

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          className="rounded bg-slate-150 dark:bg-slate-800 px-1.5 py-0.5 text-[0.78rem] font-black font-mono text-slate-900 dark:text-rose-400 border border-slate-200 dark:border-slate-700/60"
          key={`${index}-code`}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          className="font-extrabold text-indigo-600 dark:text-indigo-400 underline decoration-indigo-300 dark:decoration-indigo-800/80 underline-offset-2 hover:text-indigo-800 dark:hover:text-indigo-300 hover:decoration-indigo-500 inline-flex items-center gap-0.5"
          href={linkMatch[2]}
          key={`${index}-link`}
          onClick={(event) => event.stopPropagation()}
          rel="noreferrer"
          target="_blank"
        >
          {linkMatch[1]}
          <ExternalLink className="h-3 w-3 inline shrink-0" />
        </a>
      );
    }

    return <span key={`${index}-text`}>{part}</span>;
  });
}

export default InlineText;
