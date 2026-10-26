import asyncio,json,hashlib,re,urllib.parse,zipfile,io
from pathlib import Path
from playwright.async_api import async_playwright
PLAN=json.load(open('logo-research-plan.json'));ROOT=Path('logo-research-results');ROOT.mkdir(exist_ok=True);records=[]
def digest(b):return hashlib.sha256(b).hexdigest()
async def run():
 async with async_playwright()as p:
  browser=await p.chromium.launch(headless=True);semaphore=asyncio.Semaphore(4)
  async def company(id,plan):
   async with semaphore:
    context=await browser.new_context(ignore_https_errors=False);report={'id':id,'attempts':[],'assets':[]}
    for n,url in enumerate(plan['pages']):
     page=await context.new_page();attempt={'url':url};report['attempts'].append(attempt)
     try:
      response=await page.goto(url,wait_until='domcontentloaded',timeout=25000);await page.wait_for_timeout(3000)
      attempt.update(status=response.status if response else None,finalUrl=page.url,title=await page.title(),htmlSha256=digest((await page.content()).encode()))
      candidates=await page.evaluate('''()=>{const all=[];function walk(root){for(const el of root.querySelectorAll('*')){all.push(el);if(el.shadowRoot)walk(el.shadowRoot)}}walk(document);const out=[];for(const el of all){const tag=el.tagName.toLowerCase();if(!['svg','img','a'].includes(tag))continue;const ancestors=[el];let a=el.parentElement;for(let n=0;a&&n<4;n++,a=a.parentElement)ancestors.push(a);const context=ancestors.map(a=>a.outerHTML.slice(0,300)).join(' ');const likely=/logo|logotype|brandmark|header-brand|main_logo|nav__branding/i.test(context);if(!likely)continue;const r={context:context.slice(0,600)};if(tag==='img'){r.url=el.currentSrc||el.src;if(r.url)out.push(r)}else if(tag==='svg'){r.original=el.outerHTML;const clone=el.cloneNode(true);[el,...el.querySelectorAll('*')].forEach((node,n)=>{const dest=[clone,...clone.querySelectorAll('*')][n],style=getComputedStyle(node);for(const k of ['fill','stroke','color','stop-color','fill-rule','stroke-width','opacity'])dest.style.setProperty(k,style.getPropertyValue(k))});r.svg=clone.outerHTML;out.push(r)}else{const style=getComputedStyle(el);if(style.backgroundImage.startsWith('url(')){r.url=style.backgroundImage.slice(5,-2);out.push(r)}}}return out.slice(0,35)}''')
      for i,c in enumerate(candidates):
       try:
        if c.get('svg'):data=c.pop('svg').encode();c['originalSha256']=digest(c.pop('original').encode());ext='svg';c['inlineComputed']=True
        else:
         if not c.get('url','').startswith('https://'):continue
         r=await context.request.get(c['url'],timeout=20000);data=await r.body();assert r.status==200,f'HTTP {r.status}'
         ct=r.headers.get('content-type','');ext='svg'if b'<svg'in data[:2000]else'png'if data.startswith(b'\x89PNG')else'jpg'if data[:2]==b'\xff\xd8'else'webp'if data[:4]==b'RIFF'else None
         if not ext:continue
        if len(data)>2_000_000:continue
        filename=f'{id}-{n}-{i}.{ext}';(ROOT/filename).write_bytes(data);report['assets'].append({**c,'file':filename,'page':page.url,'sha256':digest(data),'bytes':len(data)})
       except Exception as e:report['assets'].append({**c,'page':page.url,'error':str(e)})
     except Exception as e:attempt['error']=str(e).split('\n')[0]
     finally:await page.close()
    # Explicitly reviewed official asset/ZIP sources, independent of page rendering.
    for n,url in enumerate(plan.get('assets',[])):
     try:
      r=await context.request.get(url,timeout=25000);data=await r.body();assert r.status==200,f'HTTP {r.status}'
      if data.startswith(b'PK'):
       for i,name in enumerate(zipfile.ZipFile(io.BytesIO(data)).namelist()):
        if not name.lower().endswith(('.png','.svg'))or name.startswith('__MACOSX'):continue
        b=zipfile.ZipFile(io.BytesIO(data)).read(name)
        if len(b)>2_000_000:continue
        fn=f'{id}-zip-{i}'+Path(name).suffix.lower();(ROOT/fn).write_bytes(b);report['assets'].append({'file':fn,'source':url,'archiveMember':name,'sha256':digest(b),'bytes':len(b)})
      else:
       ext='svg'if b'<svg'in data[:2000]else'png'if data.startswith(b'\x89PNG')else'jpg'if data[:2]==b'\xff\xd8'else None
       if ext:
        fn=f'{id}-asset-{n}.{ext}';(ROOT/fn).write_bytes(data);report['assets'].append({'file':fn,'source':url,'sha256':digest(data),'bytes':len(data)})
     except Exception as e:report['attempts'].append({'url':url,'error':str(e)})
    await context.close();records.append(report);(ROOT/'index.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n');print(id,len([a for a in report['assets']if a.get('file')]),flush=True)
  await asyncio.gather(*(company(id,plan)for id,plan in PLAN.items()));await browser.close()
asyncio.run(run())
