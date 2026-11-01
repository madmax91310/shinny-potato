import parseTweet from 'twitter-text/dist/parseTweet.js'

// The X parser (emoji sequences, URL weighting) loads only when a question is displayed.
export default function QuestionCounter({ text }) {
  const count = parseTweet(text).weightedLength
  return <p className="tb-character-count" role="status">{count} / 280 caractères sur X{count > 280 ? ' · dépasse la limite standard' : ''}</p>
}
