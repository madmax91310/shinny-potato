#!/usr/bin/env node
// Tests Playwright par outil — navigateur réel (Chromium), un "write→look once" formalisé en
// script réutilisable plutôt que refait à la main à chaque changement. Committé le 14/09/2026
// (audit "outils", documenté comme "à committer" dans scripts/README.md).
//
// Usage : npm run build && node scripts/playwright-tools.mjs   (ou npm run test:tools, qui
// enchaîne le build automatiquement)
//
// Lance son propre `vite preview` sur le port 4310 (au-delà des ports habituels de session
// manuelle, 4173-4177, pour ne jamais entrer en conflit avec un serveur déjà lancé à la main),
// exerce une interaction réelle par outil (pas seulement "la page charge sans erreur"), puis
// arrête le serveur — y compris si un test échoue (cf. finally).
//
// Dépend de Chromium pré-installé à /opt/pw-browsers/chromium et du paquet playwright installé
// globalement à /opt/node22/lib/node_modules/playwright (ni l'un ni l'autre n'est une dépendance
// du projet — cf. scripts/README.md) : ne tourne que dans cet environnement de session, pas sur
// une machine quelconque sans ces deux chemins.
//
// Sort avec le code 1 si un test échoue (utilisable comme porte de CI).

import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";

const PORT = 4310;
const BASE = `http://localhost:${PORT}/shinny-potato`;

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) return resolve();
      } catch {}
      if (Date.now() - start > timeoutMs) return reject(new Error(`Serveur non prêt après ${timeoutMs}ms`));
      setTimeout(tick, 300);
    };
    tick();
  });
}

const results = [];
function record(tool, ok, detail) {
  results.push({ tool, ok, detail });
  console.log(`  [${ok ? "OK" : "ÉCHEC"}] ${tool}${detail ? " — " + detail : ""}`);
}

async function testCalculateur(page) {
  await page.goto(`${BASE}/calculateur-investissement`, { waitUntil: "networkidle" });
  await page.locator("select.ic-control").first().selectOption("bitcoin");
  await page.waitForTimeout(150);
  const hero = await page.locator(".ic-hero-number").innerText();
  const heroOk = /\d/.test(hero);

  await page.locator("select.ic-control").first().selectOption("lvmh");
  await page.waitForTimeout(150);
  const text = await page.locator("body").innerText();
  const badgeOk = /non vérifiées avant/.test(text);
  const dcaBlockOk = /DCA non disponible pour LVMH/.test(text);

  record("Calculateur d'investissement", heroOk && badgeOk && dcaBlockOk,
    `résultat Bitcoin rendu: ${heroOk}, badge LVMH: ${badgeOk}, DCA bloqué: ${dcaBlockOk}`);
}

async function testPortfolioGenerator(page) {
  await page.goto(`${BASE}/generateur-portefeuilles`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Générer un nouveau portefeuille/i }).click();
  await page.waitForTimeout(200);
  const pcts = await page.locator(".pg-alloc-pct").allInnerTexts();
  const sum = pcts.reduce((s, t) => s + parseFloat(t), 0);
  const sumOk = Math.abs(sum - 100) < 0.5;
  const cta = await page.locator("body").innerText();
  const hasContent = cta.length > 500;
  record("Générateur de portefeuilles", sumOk && hasContent, `somme des lignes: ${sum.toFixed(1)}%, contenu rendu: ${hasContent}`);
}

async function testEtfSheets(page) {
  await page.goto(`${BASE}/fiches-etf`, { waitUntil: "networkidle" });
  const select = page.locator("select").first();
  const count = await select.locator("option").count();
  let badCount = 0;
  for (let i = 0; i < count; i++) {
    await select.selectOption({ index: i });
    await page.waitForTimeout(40);
    const text = await page.locator("body").innerText();
    if (/undefined|NaN/.test(text)) badCount++;
  }
  record("Fiches ETF", badCount === 0, `${count} fiches cyclées, ${badCount} avec un champ "undefined"/"NaN"`);
}

async function testBrokerComparator(page) {
  await page.goto(`${BASE}/comparatif-courtiers`, { waitUntil: "networkidle" });
  await page.waitForTimeout(150);
  // Le texte généré vit dans la value d'un <textarea> (bc-tweet-textarea) — jamais capturé par
  // innerText(), qui n'expose pas le contenu des champs de formulaire.
  const tweet = await page.locator(".bc-tweet-textarea").inputValue();
  const ok = /FRAIS DE COURTAGE|VERDICT FINAL/.test(tweet);
  record("Comparatif courtiers", ok, "texte du duel par défaut généré");
}

async function testTweetMidi(page) {
  await page.goto(`${BASE}/tweet-midi`, { waitUntil: "networkidle" });
  const formats = ["Vrai ou Faux", "Dilemme", "Fiche lexique", "Comparatif ETF", "Il y a X ans", "Performance depuis", "Pouvoir d'achat"];
  let failed = [];
  for (const label of formats) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.waitForTimeout(150);
    const text = await page.locator("body").innerText();
    if (text.length < 500) failed.push(label);
  }
  record("Tweet Midi", failed.length === 0, failed.length ? `formats sans contenu suffisant: ${failed.join(", ")}` : `${formats.length} formats cyclés`);
}

async function testIndexComparator(page) {
  await page.goto(`${BASE}/comparateur-indices`, { waitUntil: "networkidle" });
  const select = page.locator("select").first();
  const count = await select.locator("option").count();
  let ok = 0;
  for (let i = 0; i < count; i++) {
    await select.selectOption({ index: i });
    await page.waitForTimeout(100);
    const text = await page.locator("body").innerText();
    if (/L'EXPOSITION/.test(text) && /DIVERSIFICATION/.test(text) && /PERFORMANCE/.test(text) && /LE VERDICT/.test(text)) ok++;
  }
  record("Comparateur d'indices", ok === count, `${ok}/${count} familles avec les 4 blocs clés`);
}

async function testFeeImpact(page) {
  await page.goto(`${BASE}/impact-frais`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Aléatoire/i }).click();
  await page.waitForTimeout(150);
  const text = await page.locator("body").innerText();
  const ok = /Avec [\d,]+\s*%\s+de frais/.test(text);
  record("Impact des frais", ok, "comparaison générée après tirage Aléatoire");
}

async function testMarketFacts(page) {
  await page.goto(`${BASE}/faits-marquants-marches`, { waitUntil: "networkidle" });
  const select = page.locator("select").first();
  const count = await select.locator("option").count();
  let badCount = 0;
  for (let i = 0; i < count; i++) {
    await select.selectOption({ index: i });
    await page.waitForTimeout(40);
    const text = await page.locator("body").innerText();
    if (/undefined|NaN/.test(text) || !/Source :/.test(text)) badCount++;
  }
  record("Faits marquants des marchés", badCount === 0, `${count} faits cyclés, ${badCount} sans source/avec un champ manquant`);
}

async function testTweetBank(page) {
  await page.goto(`${BASE}/banque-tweets`, { waitUntil: "networkidle" });
  const totalBefore = await page.locator(".tb-summary-num").first().innerText();
  await page.locator(".tb-tweet-actions button", { hasText: "Marquer publié aujourd" }).first().click();
  await page.waitForTimeout(150);
  const cooldownCount = (await page.locator(".tb-summary-num").allInnerTexts())[1];
  const badge = await page.locator(".tb-pub-badge.cooldown").first().count();
  const ok = totalBefore === "42" && cooldownCount === "1" && badge === 1;
  record("Banque de tweets", ok, `total: ${totalBefore}, en repos après marquage: ${cooldownCount}, badge cooldown affiché: ${badge === 1}`);
}

let server;
try {
  console.log(`Démarrage de vite preview sur le port ${PORT}...`);
  // detached: true (POSIX) pour pouvoir tuer tout le groupe de processus à la fin — `npx vite
  // preview` lance un processus enfant (vite lui-même) que server.kill() seul ne termine PAS,
  // laissant un serveur orphelin sur le port derrière lui (bug constaté à l'écriture de ce
  // script : deux exécutions successives ont laissé 5 processus node/sh orphelins).
  server = spawn("npx", ["vite", "preview", "--port", String(PORT)], { stdio: "pipe", detached: true });
  await waitForServer(`${BASE}/`);
  console.log("Serveur prêt.\n");

  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const page = await browser.newPage();

  await testCalculateur(page);
  await testPortfolioGenerator(page);
  await testEtfSheets(page);
  await testBrokerComparator(page);
  await testTweetMidi(page);
  await testIndexComparator(page);
  await testFeeImpact(page);
  await testMarketFacts(page);
  await testTweetBank(page);

  await browser.close();
} finally {
  if (server) {
    try {
      process.kill(-server.pid, "SIGTERM"); // tue le groupe entier (npx + vite), pas juste npx
    } catch {
      server.kill(); // fallback (ex. plateforme sans groupes de processus)
    }
  }
}

const failures = results.filter((r) => !r.ok);
console.log(`\n${results.length - failures.length}/${results.length} outils OK.`);
if (failures.length) {
  console.log("ÉCHEC — voir le détail ci-dessus avant de déployer.");
  process.exitCode = 1;
} else {
  console.log("OK — tous les outils passent leur test fonctionnel en navigateur réel.");
}
// Sortie explicite : un handle résiduel (ex. connexion Playwright) peut empêcher Node de
// terminer seul — sans ça, le process reste accroché malgré un travail déjà terminé.
process.exit(process.exitCode ?? 0);
