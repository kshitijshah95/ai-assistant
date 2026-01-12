import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
});

// Add target="_blank" to links
const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, _env, self) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
  const aIndex = tokens[idx].attrIndex('target');
  if (aIndex < 0) {
    tokens[idx].attrPush(['target', '_blank']);
  } else {
    const attrs = tokens[idx].attrs;
    if (attrs) {
      attrs[aIndex][1] = '_blank';
    }
  }
  
  const relIndex = tokens[idx].attrIndex('rel');
  if (relIndex < 0) {
    tokens[idx].attrPush(['rel', 'noopener noreferrer']);
  }
  
  return defaultRender(tokens, idx, options, env, self);
};

export function renderMarkdown(content: string): string {
  const rendered = md.render(content);
  return DOMPurify.sanitize(rendered, {
    ADD_ATTR: ['target', 'rel'],
  });
}
