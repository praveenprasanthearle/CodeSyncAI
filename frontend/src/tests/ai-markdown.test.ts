import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AiMessageContent } from '../components/workspace/AiMessageContent';

describe('Assistant Markdown rendering', () => {
  it('renders prose, fenced code and mathematics', () => {
    const markup = renderToStaticMarkup(React.createElement(AiMessageContent, { text: '## Explanation\n\n$x^2$\n\n```js\nconsole.log(42);\n```' }));
    expect(markup).toContain('<h2>Explanation</h2>');
    expect(markup).toContain('katex'); expect(markup).toContain('console.log(42)');
  });
  it('does not turn raw HTML or JavaScript links into executable content', () => {
    const markup = renderToStaticMarkup(React.createElement(AiMessageContent, { text: '<script>alert(1)</script>\n\n[link](javascript:alert%281%29)' }));
    expect(markup).not.toContain('<script>'); expect(markup).not.toContain('href="javascript:');
  });
});
