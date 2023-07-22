export default async function (page, dataset) {
  await page.goto(dataset.url);
  await page.waitForSelector('li')

  const details = await page.evaluate(e => {
    const allElements = Array.from(document.querySelectorAll('li'))
    return allElements
      .map(e => e.innerText.split(': '))
      .reduce((data, val) => {
        data[val[0].toLowerCase()] = val[1]; 
        return data
      }, {})
  })

  return {...dataset, ...details}
}
