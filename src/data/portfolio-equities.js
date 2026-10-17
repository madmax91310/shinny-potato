import RETURNS from './equity-duel-returns.json' with { type: 'json' }
import LINKS from './equity-history-links.json' with { type: 'json' }

// Manual composition only. The same validated EUR calendar feeds portfolio duels.
export const PORTFOLIO_EQUITIES = RETURNS.flatMap(record => {
  const identity = LINKS[record.historyId]
  if (!identity || Object.keys(record.euroCalendarReturns ?? {}).length < 3) return []
  return [{ id: record.id, isin: identity.isin, name: identity.label, instrumentType: 'EQUITY',
    cat: 'actions_individuelles', emoji: '🏢', manualOnly: true, returnCurrency: 'EUR',
    calendarReturns: record.euroCalendarReturns,
    r: Array.from({length:6}, (_, i) => record.euroCalendarReturns[2020+i] ?? null),
    confidenceNote: 'Cours ajustés des dividendes et divisions ; performances en euros, change BCE de fin d’année, hors courtage et fiscalité.',
    desc: [`Actions de ${identity.label}.`, 'Une position dans une seule entreprise, qui peut déjà figurer dans les ETF du portefeuille.', 'Risque de concentration et de perte en capital.'],
  }]
})
