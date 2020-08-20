import marked from 'marked';

export function parseMD(document: string) {
  return marked.lexer(document);
}
