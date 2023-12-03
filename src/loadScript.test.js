import path from 'path'
import { fileURLToPath } from 'url';
import loadScript from './loadScript.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('should load sript', async () => {
  const lib = await loadScript(path.resolve(__dirname, 'mocks', 'testScript.mock.js'))
  expect(lib).toHaveProperty('default')
  expect(lib.default).toBeInstanceOf(Function)

  const dataset =  await lib.default({}, {foo: 'bar-324'})
  
  expect(dataset).toMatchObject({ foo: 'bar-324', testedByMock: true })
});
