export function firstGrapheme(text = '') {
  return [...new Intl.Segmenter('fr', { granularity: 'grapheme' }).segment(text)][0]?.segment ?? ''
}
