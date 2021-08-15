import React from 'react';
import ReactMarkdown from 'markdown-to-jsx';

export const Markdown: React.FC<{ text: string }> = ({ text }) => (
  <ReactMarkdown children={text} options={{ disableParsingRawHTML: true }} />
);
