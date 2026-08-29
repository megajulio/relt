'use client';

import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: 'typescript' | 'bash' | 'env';
  title?: string;
}

export function CodeBlock({ code, language = 'typescript', title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silencioso
    }
  }

  return (
    <div className="relative bg-gray-950 border border-gray-800 rounded-lg overflow-hidden">
      {title && (
        <div className="px-4 py-2 border-b border-gray-800 bg-gray-900/50">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {title}
          </span>
        </div>
      )}

      <div className="relative">
        <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
          <code className={language === 'typescript' ? 'text-blue-300' : 'text-green-300'}>
            {code}
          </code>
        </pre>

        <button
          onClick={copyToClipboard}
          className={`absolute top-3 right-3 text-xs font-medium px-3 py-1.5 rounded-md transition-all ${
            copied
              ? 'bg-green-600 text-white'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
        >
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
