// Small bounded HTML scope helper; matching nested tags prevents a sidebar or
// the first closing div from becoming the article. No script execution.
export function htmlElement(html,start) {
  const opening=html.slice(start).match(/^<([a-z][a-z0-9:-]*)\b[^>]*>/i)
  if(!opening)return ''
  const name=opening[1],tokens=new RegExp(`<\\/?${name}\\b[^>]*>`,'gi');tokens.lastIndex=start
  let depth=0,match
  while((match=tokens.exec(html))){depth+=match[0].startsWith('</')?-1:1;if(depth===0)return html.slice(start,tokens.lastIndex)}
  return ''
}
export function articleBody(html) {
  const clean=html.replace(/<(script|style|nav|header|footer|aside)\b[^>]*>[\s\S]*?<\/\1>/gi,'')
  const markers=[/<[^>]+\bitemprop=["']articleBody["'][^>]*>/i,/<[^>]+(?:id|class)=["'][^"']*(?:article-body|article__body|article-content|article_content|article-contenu|article-texte|entry-content|news-detail__description)[^"']*["'][^>]*>/i,/<article\b[^>]*>/i,/<main\b[^>]*>/i]
  for(const pattern of markers){const match=pattern.exec(clean);if(match){const body=htmlElement(clean,match.index);if(body)return body}}
  return ''
}
