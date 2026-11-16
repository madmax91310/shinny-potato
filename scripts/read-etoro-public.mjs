import { chromium } from 'playwright';
import { parseEtoroPublic } from './lib/etoro-public.mjs';

const [username, consulted] = process.argv.slice(2);
if (!/^[a-zA-Z0-9_-]{1,80}$/.test(username || '') || !/^\d{4}-\d{2}-\d{2}$/.test(consulted || '')) throw Error('Profil public ou date invalides');
const browser = await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']} : {})});
try {
  const context = await browser.newContext({locale:'en-US'});
  const page = await context.newPage();
  let identity, stats, statsCID, portfolio, portfolioCID;
  const pending = [];
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.origin !== 'https://www.etoro.com' || response.status() !== 200) return;
    if (url.pathname === `/api/logininfo/v1.1/users/${username}`) pending.push(response.json().then(value => {identity={username:value.username,realCID:value.realCID};}).catch(()=>{}));
    const match = url.pathname.match(/^\/api\/userpagestats\/v1\/user\/(\d+)\/stats\/components$/);
    if (match) pending.push(response.json().then(value => {stats=value;statsCID=Number(match[1]);}).catch(()=>{}));
    if (url.pathname === '/sapi/trade-data-real/live/public/portfolios') pending.push(response.json().then(value => {portfolio=value;portfolioCID=Number(url.searchParams.get('cid'));}).catch(()=>{}));
  });
  await page.goto(`https://www.etoro.com/people/${username}/stats`,{waitUntil:'domcontentloaded',timeout:45000});
  await page.getByText('Trading since',{exact:false}).first().waitFor({timeout:45000});
  await Promise.all(pending);
  if (!stats || statsCID !== identity?.realCID) throw Error('Statistiques publiques non qualifiées');
  portfolio=null;
  await page.goto(`https://www.etoro.com/people/${username}/portfolio`,{waitUntil:'domcontentloaded',timeout:45000});
  const titles=page.locator('[automation-id="cd-public-portfolio-table-item-title"]');
  await titles.first().waitFor({timeout:45000});
  await Promise.all(pending);
  if (!portfolio || portfolioCID !== identity?.realCID) throw Error('Allocation publique non qualifiée');
  const names = await titles.evaluateAll(elements => elements.map(element => {
    const cell=element.closest('.et-table-first-cell');
    const image=cell?.querySelector('[automation-id="trade-item-avatar"]');
    const id=image?.getAttribute('src')?.match(/\/market-avatars\/(\d+)\//)?.[1];
    return {id:Number(id),name:cell?.querySelector('.et-font-xxs')?.textContent?.trim() || ''};
  }));
  // The public percentages do not identify the account currency: leave it unknown.
  console.log(JSON.stringify(parseEtoroPublic({username,identity,stats,portfolio,names,consulted})));
} finally { await browser.close(); }
