#!/usr/bin/env node
// Échéance éditoriale de 180 jours. Les séries historiques restent figées jusqu'à
// leur prochaine revue : ce rappel ne juge ni leur exactitude ni leur complétude.
const DAY = 86400000
const START = Date.UTC(2026, 8, 27) // Décision du 27 septembre 2026.

function utcDay(value) {
  const date = new Date(`${value}T00:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`Date invalide : ${value}`)
  }
  return date.getTime()
}

const argument = process.argv[2]
if (argument && !/^\d{4}-\d{2}-\d{2}$/.test(argument)) throw new Error('Usage : node scripts/data-review-reminder.mjs [AAAA-MM-JJ]')
const today = argument ? utcDay(argument) : utcDay(new Date().toISOString().slice(0, 10))
const cycle = Math.floor((today - START) / (180 * DAY))
// Le workflow tourne le lundi. Après l'échéance, il ouvre une issue une seule
// fois pour le cycle courant, même si un lancement hebdomadaire a été retardé.
if (cycle >= 1) console.log(new Date(START + cycle * 180 * DAY).toISOString().slice(0, 10))
