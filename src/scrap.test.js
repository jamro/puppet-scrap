import scrap from './scrap.js'

describe('options parameters validation', () => {
  test('should throw an error if options.dataset is missing', async () => {
    const options = { script: 'test_script' }; // dataset is missing
    await expect(scrap(options)).rejects.toThrow('Missing parameter: options.dataset is required!');
  });

  test('should throw an error if options.script is missing', async () => {
    const options = { dataset: 'test_dataset' }; // script is missing
    await expect(scrap(options)).rejects.toThrow('Missing parameter: options.script is required!');
  });

});