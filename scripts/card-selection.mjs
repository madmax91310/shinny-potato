// Exercise the visible buttons, including scrollable result lists.
export async function choose(picker, choice) {
  // A partial label can also match its search input; operate on the picker root.
  picker=picker.locator('xpath=self::*[@data-selector] | .//*[@data-selector]')
  await picker.waitFor({state:'attached'})
  if(!await picker.isVisible()){
    const settings=picker.page().getByRole('button',{name:'Réglages',exact:true})
    if(await settings.isVisible())await settings.click()
  }
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
  // Some workspaces switch to the publication preview after selecting a support.
  await picker.waitFor({state:'attached'})
}
