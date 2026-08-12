"""Turn fetched market facts into a tweet that follows the house style."""

from __future__ import annotations

import os

import anthropic

from .market_data import MarketQuote
from .news import Headline

SYSTEM_PROMPT = """Tu es un assistant qui rédige le tweet quotidien de point marché pour un \
compte X français d'éducation financière. Audience : épargnants et investisseurs \
particuliers. Positionnement : rendre la finance accessible sans la vulgariser à l'excès.

STYLE — à faire :
- Phrases complètes, jamais de tirets ou de listes
- Termes techniques corrects : ATH, bear market, consolidation, range, correction, objectif de cours
- Contexte autour de chaque chiffre, jamais le chiffre seul
- Une perspective ou analyse courte mais précise
- Une seule idée forte par tweet
- Question de fin précise, liée à l'actu du jour
- Ton neutre et factuel, avec une légère perspective personnelle

STYLE — à ne jamais faire :
- "Les marchés envoient des signaux contradictoires"
- "En gros", "clairement", "forcément", "évidemment"
- Superlatifs inutiles : "énorme", "historique", "incroyable"
- Commencer par "Il est important de noter que"
- Listes à puces ou tirets, phrases sans verbe
- Termes vagues : "ça bouge", "ça corrige fort", "ça cartonne"
- Emojis excessifs
- Inventer un chiffre ou une news : si une donnée n'est pas fournie, ne pas l'inclure

FORMAT (respecte-le exactement, y compris les sauts de ligne) :
Bonjour à tous 👋

Que s'est-il passé hier sur les marchés ? 👇

[2-3 phrases qui racontent la journée d'hier avec contexte et perspective, tirées \
uniquement des données fournies]

[Question de fin précise et engageante liée à l'actu]

CONTRAINTE : 280 caractères maximum. Si ce n'est pas possible en respectant le style, \
renvoie deux tweets séparés par une ligne "---", chacun de 280 caractères maximum, le \
second poursuivant l'idée du premier et portant la question de fin."""


def build_facts_block(quotes: dict[str, MarketQuote], headlines: list[Headline]) -> str:
    lines = ["Cours de clôture de la veille (données vérifiées) :"]
    for quote in quotes.values():
        if quote.close is None:
            continue
        sign = "+" if (quote.change_pct or 0) >= 0 else ""
        lines.append(f"- {quote.label} : {quote.close:,.2f} ({sign}{quote.change_pct:.2f}%)")

    if headlines:
        lines.append("\nActualités du jour (données vérifiées) :")
        for headline in headlines:
            lines.append(f"- {headline.title} ({headline.source})")

    return "\n".join(lines)


def generate_tweet(quotes: dict[str, MarketQuote], headlines: list[Headline]) -> str:
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    facts = build_facts_block(quotes, headlines)

    message = client.messages.create(
        model=os.environ.get("TWEET_MODEL", "claude-sonnet-5"),
        max_tokens=500,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": (
                    "Voici les seules données vérifiées disponibles pour aujourd'hui. "
                    "Génère le tweet du point marché en respectant strictement le style "
                    "et sans utiliser aucune autre donnée.\n\n" + facts
                ),
            }
        ],
    )
    return message.content[0].text.strip()
