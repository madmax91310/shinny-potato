// Exercise the visible buttons, including scrollable result lists.
export async function choose(picker, choice) {
  const target = typeof choice === 'object' && 'index' in choice
    ? picker.locator('[data-option]').nth(choice.index)
    : picker.locator(`[data-option][data-value=${JSON.stringify(String(choice))}]`)
  await target.click()
}
