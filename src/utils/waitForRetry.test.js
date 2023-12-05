import waitForRetry from './waitForRetry.js'

test('should wait 2 seconds', async () => {
  const logs= []
  const loggerMock = {
    log: (msg) => logs.push(msg)
  }
  const startTime = performance.now()
  await waitForRetry(2, loggerMock)
  const dt = performance.now() - startTime

  expect(logs).toContain('Retry in 0:00:02...')
  expect(logs).toContain('Retry in 0:00:01...')
  expect(logs).toContain('Retry in 0:00:00...')

  expect(dt).toBeGreaterThan(1800)
  expect(dt).toBeLessThan(2500)

});
