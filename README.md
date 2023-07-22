# Puppet Scrap

Puppet Scrap is a Node.js application designed to scrape data from web pages using Puppeteer and perform JSON Path queries on a dataset. This tool allows you to extract specific elements from a JSON dataset by executing a scraping script on the web pages. It takes the following inputs:

- **Dataset in JSON format:** The dataset contains all the necessary data needed for scraping, such as URLs or other relevant information. This JSON dataset serves as the data source for the scraping process.
- **JSON Path Query:** A JSON Path query is provided, which selects specific items from the dataset. These selected items represent the data points for which the scraping process will be executed. The JSON Path query allows users to specify the exact data elements they want to scrape from the dataset.
- **Scraping Script**: Users provide a JavaScript file (script) that performs the actual scraping task. The scraping script receives two arguments: a reference to the browser page (Puppeteer.js) and the dataset. It is responsible for navigating to the specified URLs, extracting the required data from the web pages, and updating the dataset with the scraped information. For Example:

  ```javascript
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
  ```

## Usage
To display Puppet Scrap usage instruction run
  ```
  puppet-scrap.js --help
  ```

## How it works
- It parses the command-line arguments provided by the user, such as the dataset file path, scraping script file path, JSON Path query, output file path, and other optional parameters like delay, limit, and pretty output.
- If there is a progress file stored (`.${projectName}.progress.json`), indicating previous scraping progress, it will be loaded to resume the scraping process.
- The tool reads the dataset from the specified JSON file and parses it.
- The scraping script is loaded from the provided file path. This script will be used to extract data from web pages.
- A JSON Path query is executed on the dataset based on the user-provided query. This query identifies the data points for which the scraping script will be applied.
- The headless Chrome browser is launched using Puppeteer.
- For each data point obtained from the JSON Path query and within the specified limit, the scraping process is executed.
- The progress is updated, and the tool stores the current progress in a progress file (`.${projectName}.progress.json`).
- After scraping all the data points or reaching the specified limit, the browser is closed, and the progress file is deleted if the scraping process is complete.

### Example
Using Puppet Scrap with the provided example:

  ```bash
  puppet-scrap.js --dataset ./data/products_1.json --script ./scripts/list.js --query '$[*]' --output ./data/products_2.json
  ```

This will execute Puppet Scrap on the `./data/products_1.json` dataset file. It will apply the scraping script located at `./scripts/list.js` to each data point selected by the JSON Path query `$[*]`. The scraped information will be updated in the dataset, and the final dataset will be saved to `./data/products_2.json`

To demonstrate how Puppet Scrap works, we have provided an example folder containing a demo that you can run. The demo includes a dummy website that simulates a product catalog. Here's how you can run the example:

- Start the dummy website by running the following command at the root of the Puppet Scrap project:
  ```bash
    npm run example
  ```
- This will start the product catalog at http://localhost:3456
- Go to the example folder using the following command and run the `scrap.sh` script to execute Puppet Scrap on the example dataset:
  ```bash
    cd ./example
    ./scrap.sh
  ```
- Puppet Scrap will use the provided dataset in JSON format, perform the multi-step scraping, and update the dataset with the scraped information. The output will be saved to './data' folder. See source of `scrap.sh` for more details

## Important Notes
- Before running Puppet Scrap, ensure you have `Node.js` installed on your system.
- Always be respectful of websites' terms of service and consider adding delays between requests to avoid overloading servers.
- Make sure your scraping activities comply with legal and ethical guidelines, respecting the website owners' policies.
- Test your scripts thoroughly and be prepared to handle various edge cases and errors gracefully.

With Puppet Scrap's power and flexibility, you can easily scrape data from dynamic web pages and use it for various purposes, from data analysis to building datasets for machine learning models. Enjoy exploring the endless possibilities!