function InlineText({ text }) {
  // Split on both backtick code spans and markdown links
  // Captures: `code`, [label](url)
  const parts = text.split(/(`[^`]+`|\[[^\]]+\]\([^)]+\))/g);

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.78rem] font-semibold text-slate-900"
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
          className="font-medium text-indigo-600 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-800 hover:decoration-indigo-500"
          href={linkMatch[2]}
          key={`${index}-link`}
          onClick={(event) => event.stopPropagation()}
          rel="noreferrer"
          target="_blank"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return <span key={`${index}-text`}>{part}</span>;
  });
}

export default InlineText;
