import React from 'react';

export function ClickableInstructions({ text, color }: { text: string; color: string }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <span className="break-words whitespace-pre-wrap">
      {parts.map((part, idx) => {
        if (urlRegex.test(part)) {
          return (
            <a
              key={idx}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline font-bold"
              style={{ color }}
            >
              {part}
            </a>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
}

export function NoLinkTemplate({ color }: { color: string }) {
  return (
    <div 
      className="p-3 rounded-lg border-2 border-dashed border-gray-300"
      style={{ backgroundColor: color + '15' }}
    >
      <p className="text-xs font-bold text-gray-600 uppercase">⚠️ Link Status</p>
      <p className="font-black text-sm mt-1" style={{ color }}>
        No Link Provided
      </p>
      <p className="text-xs text-gray-500 mt-1 italic">Item/Game not yet published</p>
    </div>
  );
}
