export default async function (page, dataset) {
  await page.goto(dataset.url);
  await page.waitForSelector('li')

  dataset.products = await page.evaluate(e => {
    const allElements = Array.from(document.querySelectorAll('li a'))
    return allElements
      .map(e => ({name: e.innerHTML, url: e.href}))
  })
  return dataset
}
