import React from 'react';

type Props = { content: string };

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const renderSimple = (raw: string) => {
  if (!raw) return '';
  // Escape HTML first
  let out = escapeHtml(raw);
  // Bold **bold**
  out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic *italic*
  out = out.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Inline code `code`
  out = out.replace(/`([^`]+?)`/g, '<code>$1</code>');
  // Paragraphs: replace two or more newlines with paragraph separator
  out = out.replace(/\r/g, '');
  out = out.replace(/\n\n+/g, '</p><p>');
  // Single newlines -> <br />
  out = out.replace(/\n/g, '<br/>');
  return `<p>${out}</p>`;
};

const SimpleMarkdown: React.FC<Props> = ({ content }) => {
  const html = renderSimple(content || '');
  return <div className="simple-markdown text-sm leading-6" dangerouslySetInnerHTML={{ __html: html }} />;
};

export default SimpleMarkdown;
