import React from 'react';

const urlRegex = /(https?:\/\/[^\s]+)/g;

interface ClickableInstructionsProps {
  text: string;
  color?: string;
}

export function ClickableInstructions({ text, color = '#ff006e' }: ClickableInstructionsProps) {
  // Safety check to prevent .split() on null/undefined
  if (!text) {
    return null;
  }

  const parts = text.split(urlRegex);
  
  return (
    <>
      {parts.map((part, index) => {
        if (part?.match(urlRegex)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline cursor-pointer font-bold"
              style={{ color }}
            >
              {part}
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

interface NoLinkTemplateProps {
  type?: 'item' | 'game';
  color?: string;
}

export function NoLinkTemplate({ type = 'game', color = '#999' }: NoLinkTemplateProps) {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded p-3 text-center">
      <p className="text-sm font-semibold text-gray-500">⚠️ Link Status</p>
      <p className="text-xs text-gray-400 mt-1">
        {type === 'item' ? 'Item not yet published' : 'Game not yet published'}
      </p>
    </div>
  );
}
