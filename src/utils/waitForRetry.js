import formatTimeLeft from  './formatTimeLeft.js'

export default async function waitForRetry(sec, logger) {
  for(let i=sec; i > 0; i--) {
    logger.log(`Retry in ${formatTimeLeft(i)}...`)
    await new Promise(done => setTimeout(done, 1000))
  }
  logger.log(`Retry in ${formatTimeLeft(0)}...`)
}