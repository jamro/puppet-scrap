import puppeteer from 'puppeteer';
import fsAsync from "fs/promises";
import chalk from 'chalk';
import path from 'path'
import jsonpath from 'jsonpath'
import fs from 'fs';
import loadScript from './loadScript.js';
import formatTimeLeft from './utils/formatTimeLeft.js'
import waitForRetry from './utils/waitForRetry.js'
import {fillDefaultOptions} from './utils/options.js'

function getLibs(dependencies) {
  const libs = {}
  const defaultLibs = {fsAsync, fs, loadScript, console}

  const keys = Object.keys(defaultLibs)
  for (let key of keys) {
    if(dependencies[key]) {
      libs[`_${key}`] = dependencies[key]
    } else {
      libs[`_${key}`] = defaultLibs[key]
    }
  }
  return libs
}


export default async function(options={}, dependencies={}) {
  fillDefaultOptions(options)
  const {
    _fsAsync, 
    _fs,
    _loadScript,
    _console
  } = getLibs(dependencies)

  const limit = options.limit
  const dataPath = path.resolve(options.dataset)
  const workdir = path.dirname(dataPath)
  const projectName = path.basename(options.script, path.extname(options.script))
  const progressPath = path.resolve(workdir, `.${projectName}.progress.json`)
  let logger
  if(options.silent) {
    logger = Object.keys(console)
              .filter(k => typeof(console[k]) == 'function')
              .reduce((mock, key) => {
                mock[key] = () => {}; 
                return mock;
              }, {})
  } else {
    logger = _console
  }
  let outputLocation
  if(options.output) {
    outputLocation = options.output
  } else {
    outputLocation = path.resolve(workdir, 'output.json')
  }
  const outputPath = path.resolve(outputLocation)

  async function getProgress() {
    logger.log(progressPath)
    if(!_fs.existsSync(progressPath)) {
      return 0
    }
    const raw = await _fsAsync.readFile(progressPath)
    const json = JSON.parse(raw)
    return json.step
  }

  logger.log(chalk.bgYellow.bold("Starting Puppet Scrap"))
  logger.log(chalk.yellow(`===========================================`))
  logger.log(chalk.yellow(` - Script:        ${options.script}`))
  logger.log(chalk.yellow(` - Dataset:       ${options.dataset}`))
  logger.log(chalk.yellow(` - Output:        ${outputLocation}`))
  logger.log(chalk.yellow(` - Query:         ${options.query}`))
  logger.log(chalk.yellow(` - Limit:         ${limit === Number.MAX_VALUE ? "Off" : limit}`))
  logger.log(chalk.yellow(` - Delay:         ${options.delay}ms`))
  logger.log(chalk.yellow(` - Pretty:        ${options.pretty ? 'On' : 'Off'}`))
  logger.log(chalk.yellow(` - Retry on fail: ${options.retry ? 'On' : 'Off'}`))
  logger.log(chalk.yellow(`===========================================`))


  logger.log(chalk.bgGreen("\nEnvironment Setup"))
  let progress = await getProgress()
  logger.log("Current task progress: " + progress)

  // reading dataset and scripts
  logger.log(chalk.bgGreen(`\nReading dataset`))
  let dataset
  if(progress === 0) {
    logger.log(`data source: ${dataPath}`)
    try {
      dataset = await _fsAsync.readFile(dataPath, 'utf8')
    } catch(err) {
      logger.error(err)
      throw new Error(`Unable to read data source ${dataPath}. Reason: ${String(err)}`)
    }
  } else {
    logger.log(`restoring data source: ${dataPath}`)
    dataset = await _fsAsync.readFile(outputPath, 'utf8')
  }
  logger.log("Parsing dataset...")
  dataset = JSON.parse(dataset)
  const scriptPath = path.resolve(options.script)
  logger.log("Loading script from " + scriptPath)
  const scriptLib = await _loadScript(scriptPath)
  const script = scriptLib.default
  const postProcess = scriptLib.postProcess || ((d) => d)

  logger.log(chalk.bgGreen("\nQuery dataset"))
  const dataPoints = jsonpath.query(dataset, options.query)
  const subQueries = jsonpath.paths(dataset, options.query).map(p => jsonpath.stringify(p))
  logger.log("Data points found: " + dataPoints.length)

  logger.log("Launching headless Chrome")
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
    logger.log(chalk.bgGreen(`\nScraping the web (${i+1}/${dataPoints.length}). Time left: ${formatTimeLeft(timeLeft)}`))

    sampleStart = performance.now()
    await new Promise(done => setTimeout(done, Number(options.delay)))
    logger.log("Opening new browser tab")
    const page = await browser.newPage();

    logger.log("Parsing page data")
    let newDataPoint = null
    while(newDataPoint === null) {
      try {
        newDataPoint = await script(page, dataPoint)
      } catch(err) {
        logger.error('Error: Unable to scrap')
        logger.error(err)
        if(!options.retry) {
          throw err
          break;
        } else {
          await waitForRetry(10, logger)
        }
      }
    }

    jsonpath.apply(dataset, subQueries[i], (v) => {
      return newDataPoint
    })

    logger.log("Closing browser tab")
    await page.close();

    logger.log(`Data serialization...`)
    const jsonOptions = options.pretty ? [null, 2] : []
    const raw = JSON.stringify(dataset, ...jsonOptions)
    logger.log(`Writing to ${outputPath}` )
    _fsAsync.writeFile(outputPath, raw)

    progress++
    logger.log("Update task progress: ", progress)
    _fsAsync.writeFile(progressPath, JSON.stringify({step: progress}))

    logger.log(newDataPoint)
    sampleCount++
    sampleTime += (performance.now() - sampleStart)/1000

  }

  logger.log(chalk.bgGreen(`\nDataset`))
  logger.log(dataset)

  logger.log(chalk.bgGreen("\nEnvironment Cleanup"))
  logger.log("Closing headless Chrome")
  await browser.close();
  if(progress >= dataPoints.length) {
    await _fsAsync.unlink(progressPath)
    dataset = await postProcess(dataset)
    const jsonOptions = options.pretty ? [null, 2] : []
    const raw = JSON.stringify(dataset, ...jsonOptions)
    logger.log(`Writing to ${outputPath}` )
    _fsAsync.writeFile(outputPath, raw)
  }

  logger.log(chalk.yellow("\nThe job is done. Bye!"))

}