// Taille affichée sur le profil de chaque ISIN par les fiches ETF et le comparateur.
// Reprise des libellés historiques : sans source explicite ci-dessous, aucune
// nouvelle validation des montants ni de leurs dates ne résulte de la migration.
// checkedAt est la date de consultation. asOf:null indique que le profil
// ne donne pas de date de valeur exploitable ; ne pas la déduire de checkedAt.
// Attention : pour IE00B3F81R35, l'émetteur distingue 8,437 Md€ pour la part
// et 13,148 Md€ pour le fonds entier au 25/09/2026. Le profil justETF reprend
// la taille de la part ; ne pas mélanger ces deux périmètres.
// Les commentaires des outils décrivent souvent des contrôles historiques ;
// les montants affichés proviennent des relevés ci-dessous.
// Deux vues d’un même ISIN peuvent être de dates ou d’arrondis différents ;
// elles sont conservées séparément jusqu’à un recoupement fiable.
export const INSTRUMENT_AUM_BY_ISIN = Object.freeze({
  "CH0454664001": Object.freeze({ index: "602 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=CH0454664001", checkedAt: "2026-09-29", amountMillions: 602, currency: "EUR", asOf: null } }),
  "DE000A27Z304": Object.freeze({ index: "788 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=DE000A27Z304", checkedAt: "2026-09-29", amountMillions: 788, currency: "EUR", asOf: null } }),
  "FR0010527275": Object.freeze({ sheet: "1 468 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0010527275", checkedAt: "2026-09-29", amountMillions: 1468, currency: "EUR", asOf: null } }),
  "FR0011440478": Object.freeze({ index: "58 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0011440478", checkedAt: "2026-09-29", amountMillions: 58, currency: "EUR", asOf: null } }),
  "FR0011550185": Object.freeze({ index: "3 509 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0011550185", checkedAt: "2026-09-29", amountMillions: 3509, currency: "EUR", asOf: null } }),
  "FR0011550193": Object.freeze({ index: "1 075 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0011550193", checkedAt: "2026-09-29", amountMillions: 1075, currency: "EUR", asOf: null } }),
  "FR0011869320": Object.freeze({ index: "150 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0011869320", checkedAt: "2026-09-29", amountMillions: 150, currency: "EUR", asOf: null } }),
  "FR0011871078": Object.freeze({ index: "68 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0011871078", checkedAt: "2026-09-29", amountMillions: 68, currency: "EUR", asOf: null } }),
  "FR0011871110": Object.freeze({ sheet: "1 259 M€ (relevé le 29/09/2026)", index: "1 259 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0011871110", checkedAt: "2026-09-29", amountMillions: 1259, currency: "EUR", asOf: null } }),
  "FR0011871128": Object.freeze({ sheet: "1 215 M€ (relevé le 29/09/2026)", index: "1 215 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0011871128", checkedAt: "2026-09-29", amountMillions: 1215, currency: "EUR", asOf: null } }),
  "FR0013411980": Object.freeze({ index: "133 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0013411980", checkedAt: "2026-09-29", amountMillions: 133, currency: "EUR", asOf: null } }),
  "FR0013411998": Object.freeze({ sheet: "61 M€ (relevé le 29/09/2026)", index: "61 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0013411998", checkedAt: "2026-09-29", amountMillions: 61, currency: "EUR", asOf: null } }),
  "FR0013412004": Object.freeze({ index: "236 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0013412004", checkedAt: "2026-09-29", amountMillions: 236, currency: "EUR", asOf: null } }),
  "FR0013412012": Object.freeze({ index: "755 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0013412012", checkedAt: "2026-09-29", amountMillions: 755, currency: "EUR", asOf: null } }),
  "FR0013412020": Object.freeze({ index: "914 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0013412020", checkedAt: "2026-09-29", amountMillions: 914, currency: "EUR", asOf: null } }),
  "FR0013412038": Object.freeze({ index: "376 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0013412038", checkedAt: "2026-09-29", amountMillions: 376, currency: "EUR", asOf: null } }),
  "FR0013416716": Object.freeze({ index: "11 845 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0013416716", checkedAt: "2026-09-29", amountMillions: 11845, currency: "EUR", asOf: null } }),
  "FR001400U5Q4": Object.freeze({ sheet: "1 532 M€ (relevé le 29/09/2026)", index: "1 532 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR001400U5Q4", checkedAt: "2026-09-29", amountMillions: 1532, currency: "EUR", asOf: null } }),
  "FR0014017NX3": Object.freeze({ index: "63 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0014017NX3", checkedAt: "2026-09-29", amountMillions: 63, currency: "EUR", asOf: null } }),
  "GB00BJYDH287": Object.freeze({ index: "1 440 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=GB00BJYDH287", checkedAt: "2026-09-29", amountMillions: 1440, currency: "EUR", asOf: null } }),
  "GB00BLD4ZL17": Object.freeze({ sheet: "1 544 M€ (relevé le 29/09/2026)", index: "1 544 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=GB00BLD4ZL17", checkedAt: "2026-09-29", amountMillions: 1544, currency: "EUR", asOf: null } }),
  "GB00BLD4ZM24": Object.freeze({ index: "389 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=GB00BLD4ZM24", checkedAt: "2026-09-29", amountMillions: 389, currency: "EUR", asOf: null } }),
  "IE0002XZSHO1": Object.freeze({ index: "2 214 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE0002XZSHO1", checkedAt: "2026-09-29", amountMillions: 2214, currency: "EUR", asOf: null } }),
  "IE0006WW1TQ4": Object.freeze({ index: "6 817 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE0006WW1TQ4", checkedAt: "2026-09-29", amountMillions: 6817, currency: "EUR", asOf: null } }),
  "IE0007Y8Y157": Object.freeze({ sheet: "810 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE0007Y8Y157", checkedAt: "2026-09-29", amountMillions: 810, currency: "EUR", asOf: null } }),
  "IE000DQLYVB9": Object.freeze({ sheet: "54,41 M€ au 28/09/2026", index: "54,41 M€ au 28/09/2026", source: { url: "https://www.blackrock.com/fr/intermediaries/products/342916/", asOf: "2026-09-28", checkedAt: "2026-09-29", amount: 54413013, currency: "EUR" } }),
  "IE000I8KRLL9": Object.freeze({ sheet: "5 820 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE000I8KRLL9", checkedAt: "2026-09-29", amountMillions: 5820, currency: "EUR", asOf: null } }),
  "IE000L6ZMMC4": Object.freeze({ index: "145 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE000L6ZMMC4", checkedAt: "2026-09-29", amountMillions: 145, currency: "EUR", asOf: null } }),
  "IE000M7V94E1": Object.freeze({ sheet: "1 871 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE000M7V94E1", checkedAt: "2026-09-29", amountMillions: 1871, currency: "EUR", asOf: null } }),
  "IE000QDFFK00": Object.freeze({ index: "2 500 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE000QDFFK00", checkedAt: "2026-09-29", amountMillions: 2500, currency: "EUR", asOf: null } }),
  "IE000RDRMSD1": Object.freeze({ sheet: "299 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE000RDRMSD1", checkedAt: "2026-09-29", amountMillions: 299, currency: "EUR", asOf: null } }),
  "IE000YU9K6K2": Object.freeze({ sheet: "1 541 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE000YU9K6K2", checkedAt: "2026-09-29", amountMillions: 1541, currency: "EUR", asOf: null } }),
  "IE000YYE6WK5": Object.freeze({ sheet: "6 224 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE000YYE6WK5", checkedAt: "2026-09-29", amountMillions: 6224, currency: "EUR", asOf: null } }),
  "IE00B02KXK85": Object.freeze({ index: "724 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00B02KXK85", checkedAt: "2026-09-29", amountMillions: 724, currency: "EUR", asOf: null } }),
  "IE00B1FZS350": Object.freeze({ sheet: "978 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00B1FZS350", checkedAt: "2026-09-29", amountMillions: 978, currency: "EUR", asOf: null } }),
  "IE00B3F81R35": Object.freeze({ sheet: "8 437 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00B3F81R35", checkedAt: "2026-09-29", amountMillions: 8437, currency: "EUR", asOf: null, corroboratingUrl: "https://www.blackrock.com/fr/particuliers/products/251726/ishares-euro-corporate-bond-ucits-etf", corroboratingAsOf: "2026-09-25", shareClassAmount: 8437481466, fundAmount: 13147845543 } }),
  "IE00B3VVMM84": Object.freeze({ index: "3 204 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00B3VVMM84", checkedAt: "2026-09-29", amountMillions: 3204, currency: "EUR", asOf: null } }),
  "IE00B44Z5B48": Object.freeze({ index: "17 224 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00B44Z5B48", checkedAt: "2026-09-29", amountMillions: 17224, currency: "EUR", asOf: null } }),
  "IE00B4L5YX21": Object.freeze({ index: "7 580 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00B4L5YX21", checkedAt: "2026-09-29", amountMillions: 7580, currency: "EUR", asOf: null } }),
  "IE00B4NCWG09": Object.freeze({ index: "2 911 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00B4NCWG09", checkedAt: "2026-09-29", amountMillions: 2911, currency: "EUR", asOf: null } }),
  "IE00B4ND3602": Object.freeze({ sheet: "34 268 M€ (relevé le 29/09/2026)", index: "34 268 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00B4ND3602", checkedAt: "2026-09-29", amountMillions: 34268, currency: "EUR", asOf: null } }),
  "IE00B4WXJJ64": Object.freeze({ sheet: "5 230 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00B4WXJJ64", checkedAt: "2026-09-29", amountMillions: 5230, currency: "EUR", asOf: null } }),
  "IE00B52SFT06": Object.freeze({ index: "4 522 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00B52SFT06", checkedAt: "2026-09-29", amountMillions: 4522, currency: "EUR", asOf: null } }),
  "IE00B53L3W79": Object.freeze({ index: "7 718 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00B53L3W79", checkedAt: "2026-09-29", amountMillions: 7718, currency: "EUR", asOf: null } }),
  "IE00B579F325": Object.freeze({ index: "26 624 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00B579F325", checkedAt: "2026-09-29", amountMillions: 26624, currency: "EUR", asOf: null } }),
  "IE00B5M1WJ87": Object.freeze({ index: "1 810 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00B5M1WJ87", checkedAt: "2026-09-29", amountMillions: 1810, currency: "EUR", asOf: null } }),
  "IE00B66F4759": Object.freeze({ sheet: "5 028 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00B66F4759", checkedAt: "2026-09-29", amountMillions: 5028, currency: "EUR", asOf: null } }),
  "IE00B6R52259": Object.freeze({ sheet: "32 474 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00B6R52259", checkedAt: "2026-09-29", amountMillions: 32474, currency: "EUR", asOf: null } }),
  "IE00B6YX5D40": Object.freeze({ sheet: "3 357 M€ (relevé le 29/09/2026)", index: "3 357 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00B6YX5D40", checkedAt: "2026-09-29", amountMillions: 3357, currency: "EUR", asOf: null } }),
  "IE00B8FHGS14": Object.freeze({ sheet: "2 284 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00B8FHGS14", checkedAt: "2026-09-29", amountMillions: 2284, currency: "EUR", asOf: null } }),
  "IE00B8GKDB10": Object.freeze({ index: "9 930 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00B8GKDB10", checkedAt: "2026-09-29", amountMillions: 9930, currency: "EUR", asOf: null } }),
  "IE00B9CQXS71": Object.freeze({ index: "1 501 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00B9CQXS71", checkedAt: "2026-09-29", amountMillions: 1501, currency: "EUR", asOf: null } }),
  "IE00BF0M2Z96": Object.freeze({ sheet: "665 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BF0M2Z96", checkedAt: "2026-09-29", amountMillions: 665, currency: "EUR", asOf: null } }),
  "IE00BF3N7094": Object.freeze({ sheet: "1 521 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BF3N7094", checkedAt: "2026-09-29", amountMillions: 1521, currency: "EUR", asOf: null } }),
  "IE00BF4RFH31": Object.freeze({ sheet: "7 819 M€ (relevé le 29/09/2026)", index: "7 819 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BF4RFH31", checkedAt: "2026-09-29", amountMillions: 7819, currency: "EUR", asOf: null } }),
  "IE00BFZPF546": Object.freeze({ sheet: "479 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BFZPF546", checkedAt: "2026-09-29", amountMillions: 479, currency: "EUR", asOf: null } }),
  "IE00BJ5JNY98": Object.freeze({ sheet: "1 045 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BJ5JNY98", checkedAt: "2026-09-29", amountMillions: 1045, currency: "EUR", asOf: null } }),
  "IE00BJ5JP097": Object.freeze({ sheet: "123 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BJ5JP097", checkedAt: "2026-09-29", amountMillions: 123, currency: "EUR", asOf: null } }),
  "IE00BJ5JPG56": Object.freeze({ index: "2 231 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BJ5JPG56", checkedAt: "2026-09-29", amountMillions: 2231, currency: "EUR", asOf: null } }),
  "IE00BK5BCD43": Object.freeze({ sheet: "1 941 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BK5BCD43", checkedAt: "2026-09-29", amountMillions: 1941, currency: "EUR", asOf: null } }),
  "IE00BK5BQT80": Object.freeze({ sheet: "53 167 M€ (relevé le 29/09/2026)", index: "53 167 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BK5BQT80", checkedAt: "2026-09-29", amountMillions: 53167, currency: "EUR", asOf: null } }),
  "IE00BK5BR733": Object.freeze({ index: "2 148 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BK5BR733", checkedAt: "2026-09-29", amountMillions: 2148, currency: "EUR", asOf: null } }),
  "IE00BKM4GZ66": Object.freeze({ sheet: "40 069 M€ (relevé le 29/09/2026)", index: "40 069 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BKM4GZ66", checkedAt: "2026-09-29", amountMillions: 40069, currency: "EUR", asOf: null } }),
  "IE00BM8R0J59": Object.freeze({ sheet: "746 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BM8R0J59", checkedAt: "2026-09-29", amountMillions: 746, currency: "EUR", asOf: null } }),
  "IE00BMG6Z448": Object.freeze({ index: "5 048 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BMG6Z448", checkedAt: "2026-09-29", amountMillions: 5048, currency: "EUR", asOf: null } }),
  "IE00BP3QZ601": Object.freeze({ sheet: "5 613 M€ (relevé le 29/09/2026)", index: "5 613 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BP3QZ601", checkedAt: "2026-09-29", amountMillions: 5613, currency: "EUR", asOf: null } }),
  "IE00BP3QZ825": Object.freeze({ sheet: "5 433 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BP3QZ825", checkedAt: "2026-09-29", amountMillions: 5433, currency: "EUR", asOf: null } }),
  "IE00BP3QZB59": Object.freeze({ sheet: "6 506 M€ (relevé le 29/09/2026)", index: "6 506 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BP3QZB59", checkedAt: "2026-09-29", amountMillions: 6506, currency: "EUR", asOf: null } }),
  "IE00BQT3WG13": Object.freeze({ index: "2 302 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BQT3WG13", checkedAt: "2026-09-29", amountMillions: 2302, currency: "EUR", asOf: null } }),
  "IE00BYPLS672": Object.freeze({ sheet: "3 514 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BYPLS672", checkedAt: "2026-09-29", amountMillions: 3514, currency: "EUR", asOf: null } }),
  "IE00BYTRR863": Object.freeze({ sheet: "521 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BYTRR863", checkedAt: "2026-09-29", amountMillions: 521, currency: "EUR", asOf: null } }),
  "IE00BYXG2H39": Object.freeze({ sheet: "980 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BYXG2H39", checkedAt: "2026-09-29", amountMillions: 980, currency: "EUR", asOf: null } }),
  "IE00BYYHSQ67": Object.freeze({ index: "1 524 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BYYHSQ67", checkedAt: "2026-09-29", amountMillions: 1524, currency: "EUR", asOf: null } }),
  "IE00BYZK4552": Object.freeze({ sheet: "4 747 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BYZK4552", checkedAt: "2026-09-29", amountMillions: 4747, currency: "EUR", asOf: null } }),
  "JE00B1VS3770": Object.freeze({ index: "6 349 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=JE00B1VS3770", checkedAt: "2026-09-29", amountMillions: 6349, currency: "EUR", asOf: null } }),
  "LU0908500753": Object.freeze({ index: "20 925 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=LU0908500753", checkedAt: "2026-09-29", amountMillions: 20925, currency: "EUR", asOf: null } }),
  "LU1681043599": Object.freeze({ index: "6 706 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=LU1681043599", checkedAt: "2026-09-29", amountMillions: 6706, currency: "EUR", asOf: null } }),
  "LU1681047236": Object.freeze({ sheet: "4 066 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=LU1681047236", checkedAt: "2026-09-29", amountMillions: 4066, currency: "EUR", asOf: null } }),
  "LU1681048630": Object.freeze({ sheet: "343 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=LU1681048630", checkedAt: "2026-09-29", amountMillions: 343, currency: "EUR", asOf: null } }),
  "LU1834983550": Object.freeze({ sheet: "531 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=LU1834983550", checkedAt: "2026-09-29", amountMillions: 531, currency: "EUR", asOf: null } }),
  "LU2196470426": Object.freeze({ index: "441 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=LU2196470426", checkedAt: "2026-09-29", amountMillions: 441, currency: "EUR", asOf: null } }),
});

export function getInstrumentAum(isin, context) {
  const value = INSTRUMENT_AUM_BY_ISIN[isin]?.[context];
  if (!value) throw new Error(`Encours absent pour ${isin} (${context})`);
  return value;
}

export function getInstrumentAumBillions(isin) {
  const millions = INSTRUMENT_AUM_BY_ISIN[isin]?.source?.amountMillions;
  if (!Number.isFinite(millions)) throw new Error(`Encours EUR en millions absent pour ${isin}`);
  return `${(millions / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Md€`;
}
