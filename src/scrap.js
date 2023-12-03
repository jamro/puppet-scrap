import puppeteer from 'puppeteer';
import { readFile, unlink, writeFile } from "fs/promises";
import chalk from 'chalk';
import path from 'path'
import jsonpath from 'jsonpath'
import { existsSync } from 'fs';

export const defaultScrapperOptions = {
  limit: Number.MAX_VALUE,
  delay: 500,
  query: '$',
  output: undefined,
  pretty: false,
  dryrun: false,
  retry: false,
}

function fillOptions(options) {
  if(options.dataset === undefined) {
    throw new Error('Missing parameter: options.dataset is required!')
  }
  if(options.script === undefined) {
    throw new Error('Missing parameter: options.script is required!')
  }

  const keys = Object.keys(defaultScrapperOptions)
  for (let key of keys) {
    if(options[key] === undefined) {
      options[key] = defaultScrapperOptions[key]
    }
  }

  return options
}

function formatTimeLeft(sec) {
  if(sec === null) return '???'
  let t = Math.round(sec)
  let s = t % 60
  t = (t - s)/60
  let m = t % 60
  t = (t - m)/60
  let h = t
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

async function waitForRetry(sec) {
  for(let i=sec; i >= 0; i--) {
    await new Promise(done => setTimeout(done, 1000))
    console.log(`Retry in ${formatTimeLeft(i)}...`)
  }
}


export default async function(options={}) {
  fillOptions(options)

  const limit = options.limit
  const dataPath = path.resolve(options.dataset)
  const workdir = path.dirname(dataPath)
  const projectName = path.basename(options.script, path.extname(options.script))
  const progressPath = path.resolve(workdir, `.${projectName}.progress.json`)
  let outputLocation
  if(options.output) {
    outputLocation = options.output
  } else {
    outputLocation = path.resolve(workdir, 'output.json')
  }
  const outputPath = path.resolve(outputLocation)

  async function getProgress() {
    console.log(progressPath)
    if(!existsSync(progressPath)) {
      return 0
    }
    const raw = await readFile(progressPath)
    const json = JSON.parse(raw)
    return json.step
  }

  console.log(chalk.bgYellow.bold("Starting Puppet Scrap"))
  console.log(chalk.yellow(`===========================================`))
  console.log(chalk.yellow(` - Script:        ${options.script}`))
  console.log(chalk.yellow(` - Dataset:       ${options.dataset}`))
  console.log(chalk.yellow(` - Output:        ${outputLocation}`))
  console.log(chalk.yellow(` - Query:         ${options.query}`))
  console.log(chalk.yellow(` - Limit:         ${limit === Number.MAX_VALUE ? "Off" : limit}`))
  console.log(chalk.yellow(` - Delay:         ${options.delay}ms`))
  console.log(chalk.yellow(` - Pretty:        ${options.pretty ? 'On' : 'Off'}`))
  console.log(chalk.yellow(` - Dry Run:       ${options.dryrun ? 'On' : 'Off'}`))
  console.log(chalk.yellow(` - Retry on fail: ${options.retry ? 'On' : 'Off'}`))
  console.log(chalk.yellow(`===========================================`))


  console.log(chalk.bgGreen("\nEnvironment Setup"))
  let progress = await getProgress()
  console.log("Current task progress: " + progress)

  // reading dataset and scripts
  console.log(chalk.bgGreen(`\nReading dataset`))
  let dataset
  if(progress === 0) {
    console.log(`data source: ${dataPath}`)
    dataset = await readFile(dataPath, 'utf8')
  } else {
    console.log(`restoring data source: ${dataPath}`)
    dataset = await readFile(outputPath, 'utf8')
  }
  console.log("Parsing dataset...")
  dataset = JSON.parse(dataset)
  const scriptPath = path.resolve(options.script)
  console.log("Loading script from " + scriptPath)
  const scriptLib = await import(scriptPath)
  const script = scriptLib.default
  const postProcess = scriptLib.postProcess || ((d) => d)

  console.log(chalk.bgGreen("\nQuery dataset"))
  const dataPoints = jsonpath.query(dataset, options.query)
  const subQueries = jsonpath.paths(dataset, options.query).map(p => jsonpath.stringify(p))
  console.log("Data points found: " + dataPoints.length)

  console.log("Launching headless Chrome")
  const browser = await puppeteer.launch({headless: "new"});

  const initProgress = progress
  let sampleCount = 0
  let sampleTime = 0
  let sampleStart
  for(let i=initProgress; i < dataPoints.length && i < (initProgress + Number(limit)); i++) {
    const dataPoint = dataPoints[i]
    let timeLeft = null
    if(sampleCount >= 5) {
      const avgSampleTime = sampleCount ? (sampleTime/sampleCount) : 0
      timeLeft = avgSampleTime * (dataPoints.length-i)
    }
    console.log(chalk.bgGreen(`\nScraping the web (${i+1}/${dataPoints.length}). Time left: ${formatTimeLeft(timeLeft)}`))
    if(!(options.dryrun)) {
      sampleStart = performance.now()
      await new Promise(done => setTimeout(done, Number(options.delay)))
      console.log("Opening new browser tab")
      const page = await browser.newPage();

      console.log("Parsing page data")
      let newDataPoint = null
      while(newDataPoint === null) {
        try {
          newDataPoint = await script(page, dataPoint)
        } catch(err) {
          console.error('Error: Unable to scrap')
          console.error(err)
          if(!options.retry) {
            throw err
            break;
          } else {
            await waitForRetry(10)
          }
        }
      }


      jsonpath.apply(dataset, subQueries[i], (v) => {
        return newDataPoint
      })

      console.log("Closing browser tab")
      await page.close();

      console.log(`Data serialization...`)
      const jsonOptions = options.pretty ? [null, 2] : []
      const raw = JSON.stringify(dataset, ...jsonOptions)
      console.log(`Writing to ${outputPath}` )
      writeFile(outputPath, raw)

      progress++
      console.log("Update task progress: ", progress)
      writeFile(progressPath, JSON.stringify({step: progress}))

      console.log(newDataPoint)
      sampleCount++
      sampleTime += (performance.now() - sampleStart)/1000

    } else {
      console.log("Entry data:")
      console.log(dataPoint)
      console.log("Dry Run Mode. Skip scraping")
    }
  }

  console.log(chalk.bgGreen(`\nDataset`))
  console.log(dataset)

  console.log(chalk.bgGreen("\nEnvironment Cleanup"))
  console.log("Closing headless Chrome")
  await browser.close();
  if(progress >= dataPoints.length) {
    await unlink(progressPath)
    dataset = await postProcess(dataset)
    const jsonOptions = options.pretty ? [null, 2] : []
    const raw = JSON.stringify(dataset, ...jsonOptions)
    console.log(`Writing to ${outputPath}` )
    writeFile(outputPath, raw)
  }

  console.log(chalk.yellow("\nThe job is done. Bye!"))

}