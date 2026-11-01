// Ces traductions s'appliquent aux caractéristiques, jamais aux noms de produits.
import LABELS from './french-characteristics.json' with {type:'json'}
export const FRENCH_CHARACTERISTIC_LABELS = Object.freeze(LABELS)

const lookup = new Map(Object.entries(LABELS).map(([key, value]) => [key.toLowerCase(), value]))
export function frenchCharacteristic(value = '') {
  return lookup.get(value.toLowerCase()) ?? value
}
export function frenchLocation(value = '') {
  return value.split(/,\s*/).map(frenchCharacteristic).join(' · ')
}
