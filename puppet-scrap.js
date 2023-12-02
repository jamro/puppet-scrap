#! /usr/bin/env node
import { program } from 'commander'
import scrap, { defaultScrapperOptions } from './src/scrapper.js'

(async () => {
  program
    .requiredOption('-d, --dataset <path>', 'Path to JSON file with the dataset.')
    .option('-o, --output <path>', 'Path to JSON file where the output will be stored')
    .requiredOption('-s, --script <path>', 'Path to scrapping script.')
    .requiredOption('-q, --query <jsonPath>', 'path to elements in datapath', defaultScrapperOptions.query)
    .option('-p, --pretty', 'Store dataset in pretty JSON format')
    .option('-t, --dryrun', 'Run JSON Path query without actual scraping')
    .option('-r, --retry', 'Retry scraping on fail')
    .requiredOption('-w, --delay', 'Delay in ms before each item scrap', defaultScrapperOptions.delay)
    .requiredOption('-l, --limit <int>', 'maximum number of items to scrap', defaultScrapperOptions.limit)

  program.parse();
  const options = program.opts();
  await scrap(options)
})();