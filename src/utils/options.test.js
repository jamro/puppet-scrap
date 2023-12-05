import { fillDefaultOptions } from "./options.js"

test('should add default values', async () => {
  const options = { dataset: 'bar', script: 'bar'}
  fillDefaultOptions(options, {alpha: 'beta6'})

  expect(options).toEqual(expect.objectContaining({ dataset: 'bar', script: 'bar', alpha: 'beta6' }));
});

test('should not overwrite existing values', async () => {
  const options = { dataset: 'bar', script: 'bar', alpha: 'gamma'}
  fillDefaultOptions(options, {alpha: 'beta6'})

  expect(options).toEqual(expect.objectContaining({ dataset: 'bar', script: 'bar', alpha: 'gamma' }));
});

test('should throw an error if options.dataset is missing', async () => {
  const options = { script: 'test_script' }; // dataset is missing
  expect(() => fillDefaultOptions(options)).toThrow('Missing parameter: options.dataset is required!');
});

test('should throw an error if options.script is missing', async () => {
  const options = { dataset: 'test_dataset' }; // script is missing
  expect(() => fillDefaultOptions(options)).toThrow('Missing parameter: options.script is required!');
});