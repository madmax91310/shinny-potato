"""Read a specific public IBKR FAQ through the endpoint used by its website.

Only published answers are read. No AI-generated completion or signed-in
session is used. Volatile request telemetry is excluded from evidence hashes.
"""
import html
import json
import re
import urllib.request

PREFIX = 'https://www.interactivebrokers.ie/lib/cstools/faq/#/content/'


def render_answer(payload, article_id):
    if str(payload.get('id')) != article_id:
        raise ValueError('Identité de la FAQ IBKR absente ou modifiée')
    question, answer = payload.get('question'), payload.get('answer')
    if not isinstance(question, str) or not isinstance(answer, str) or not question or not answer:
        raise ValueError('Réponse publiée IBKR absente ou modifiée')
    paragraphs = ''.join('<p>'+html.escape(block)+'</p>'
                         for block in re.split(r'\n\s*\n', answer) if block.strip())
    return '<html><body><main><h1>'+html.escape(question)+'</h1>'+paragraphs+'</main></body></html>'


def read_answer(url, opener=urllib.request.urlopen):
    article_id = url.removeprefix(PREFIX)
    if not url.startswith(PREFIX) or not re.fullmatch(r'\d{1,12}', article_id):
        raise ValueError('URL de FAQ IBKR hors périmètre')
    request = urllib.request.Request(
        'https://www.interactivebrokers.ie/tws.proxy/faq/content?shortDescription=false',
        data=json.dumps({'question_id':article_id}).encode(),
        headers={'Content-Type':'application/json', 'User-Agent':'EpargnantLibre-Data/1.0'})
    with opener(request, timeout=25) as response:
        final = response.geturl()
        if final != request.full_url:
            raise ValueError('Redirection de FAQ IBKR hors périmètre')
        raw = response.read(1_000_001)
    if len(raw) > 1_000_000:
        raise ValueError('FAQ IBKR trop volumineuse')
    return render_answer(json.loads(raw), article_id)
