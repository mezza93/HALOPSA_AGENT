'use client';

import { useState, lazy, Suspense, memo } from 'react';
import { Copy, Check } from 'lucide-react';

// Lazy load the syntax highlighter - this saves ~888KB from initial bundle
const SyntaxHighlighter = lazy(async () => {
  const [{ Prism }, { oneDark }] = await Promise.all([
    import('react-syntax-highlighter'),
    import('react-syntax-highlighter/dist/esm/styles/prism'),
  ]);
  return {
    default: ({ language, children }: { language: string; children: string }) => (
      <Prism
        style={oneDark}
        language={language}
        PreTag="div"
        className="rounded-lg !mt-0"
      >
        {children}
      </Prism>
    ),
  };
});

// Loading placeholder that matches the code block style
function CodeBlockLoading({ children }: { children: string }) {
  return (
    <div className="relative rounded-lg bg-[#282c34] p-4 overflow-x-auto">
      <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
        <code>{children}</code>
      </pre>
    </div>
  );
}

interface CodeBlockProps {
  language: string;
  children: string;
}

export const CodeBlock = memo(function CodeBlock({ language, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <button
        onClick={copyToClipboard}
        className="absolute right-2 top-2 rounded-md bg-gray-700 p-1.5 opacity-0 transition-opacity group-hover:opacity-100 z-10"
        title="Copy code"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-400" />
        ) : (
          <Copy className="h-4 w-4 text-gray-400" />
        )}
      </button>
      <Suspense fallback={<CodeBlockLoading>{children}</CodeBlockLoading>}>
        <SyntaxHighlighter language={language}>{children}</SyntaxHighlighter>
      </Suspense>
    </div>
  );
});
