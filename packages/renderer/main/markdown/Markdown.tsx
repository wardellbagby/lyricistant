import ReactMarkdown from 'markdown-to-jsx';
import React from 'react';

export const Markdown: React.FC<{ text: string }> = ({ text }) => (
  <ReactMarkdown children={text} options={{ disableParsingRawHTML: true }} />
);
