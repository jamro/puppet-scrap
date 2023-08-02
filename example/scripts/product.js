export default async function (page, dataset) {
  try {
    return await scrap(page, dataset)
   } catch (err) {
    console.warn(err)
    return null // skip incorrect element
   }
}


async function scrap(page, dataset) {
  // open url
  const response = await page.goto(dataset.url);

  // skip if page not found
  if(!response.ok()) {
    return null // skip incorrect element
  }
  await page.waitForSelector('li', {timeout: 1000})

  const details = await page.evaluate(e => {
    const allElements = Array.from(document.querySelectorAll('li'))
    return allElements
      .map(e => e.innerText.split(': '))
      .reduce((data, val) => {
        data[val[0].toLowerCase()] = val[1]; 
        return data
      }, {})
  })
  const seller = await page.evaluate(e => {
    const element = document.querySelector('li a')
    return {name: element.innerText, url: element.href}
  })
  return {...dataset, ...details, seller}
}

export async function postProcess(dataset) {
  dataset[0].products = dataset[0].products.filter(p => !!p)
  return dataset
}