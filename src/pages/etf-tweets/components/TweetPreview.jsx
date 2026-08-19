import { useState } from 'react'
import { buildTweetText, getLengthStatus } from '../lib/tweetFormat'
import Button from '../../../design-system/Button'

const STATUS_STYLES = {
  ok: 'border-teal-500/30 bg-teal-500/10 text-teal-300',
  warn: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  danger: 'border-red-500/30 bg-red-500/10 text-red-300',
}

export default function TweetPreview({ theme }) {
  const [copied, setCopied] = useState(false)
  const text = buildTweetText(theme)
  const status = getLengthStatus(text.length)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // clipboard indisponible (permissions navigateur) : on ignore silencieusement
    }
  }

  return (
    <div className="flex flex-col gap-3 lg:sticky lg:top-4 lg:h-fit">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Aperçu du tweet</h2>
        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[status.level]}`}>
          {status.label}
        </span>
      </div>

      <pre className="min-h-[16rem] overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-slate-200">
        {text}
      </pre>

      <Button type="button" onClick={handleCopy} className="self-start">
        {copied ? 'Copié ✓' : 'Copier le tweet'}
      </Button>
    </div>
  )
}
