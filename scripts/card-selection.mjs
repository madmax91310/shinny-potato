// Exercise the visible buttons, including scrollable result lists.
export async function choose(picker, choice) {
  await picker.waitFor({state:'attached'})
  const target = typeof choice === 'object' && 'index' in choice
    ? picker.locator('[data-option]').nth(choice.index)
    : picker.locator(`[data-option][data-value=${JSON.stringify(String(choice))}]`)
  const container=picker.locator('xpath=ancestor-or-self::div[contains(concat(" ",normalize-space(@class)," ")," asset-picker ")][1]')
  const modifier=container.getByRole('button',{name:'Modifier',exact:true})
  if(await modifier.count() && await modifier.getAttribute('aria-expanded')==='false')await modifier.click()
  for(let i=0;!await target.count()&&i<50;i++){
    const more=container.getByRole('button',{name:/^Afficher davantage/})
    if(!await more.count())break
    await more.click()
  }
  await target.click()
}
