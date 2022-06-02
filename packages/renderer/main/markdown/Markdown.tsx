import ReactMarkdown from 'markdown-to-jsx';
import React from 'react';

/**
 * Renders text as markdown.
 *
 * @param text The text to render as markdown.
 */
export const Markdown: React.FC<{ text: string }> = ({ text }) => (
  <ReactMarkdown children={text} options={{ disableParsingRawHTML: true }} />
);
