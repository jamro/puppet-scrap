import formatTimeLeft from './formatTimeLeft.js'

test('should format time', async () => {
  expect(formatTimeLeft(0)).toEqual('0:00:00')
  expect(formatTimeLeft(59)).toEqual('0:00:59')
  expect(formatTimeLeft(60)).toEqual('0:01:00')
  expect(formatTimeLeft(61)).toEqual('0:01:01')
  expect(formatTimeLeft(3599)).toEqual('0:59:59')
  expect(formatTimeLeft(3600)).toEqual('1:00:00')
  expect(formatTimeLeft(3601)).toEqual('1:00:01')
  expect(formatTimeLeft(123*3600)).toEqual('123:00:00')
});

test('should format empty time', async () => {
  expect(formatTimeLeft(null)).toEqual('???')
});