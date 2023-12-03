import scrap from './scrap.js'
import fsAsyncMock from './mocks/fsAsync.mock.js'
import fsMock from './mocks/fs.mock.js';
import path from 'path'
import getConsoleMock from './mocks/console.mock.js';

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

describe('scraping', () => {

  beforeEach(function() {
    this.disk = {}
    this.scriptMock = async function(page, dataset) {
      dataset.tested = true
      return dataset
    }

    const loadScriptMock = async () => ({
      default: this.scriptMock
    })

    this.dependencies = {
      fsAsync: new fsAsyncMock(this.disk),
      fs: new fsMock(this.disk),
      console: getConsoleMock(),
      loadScript: loadScriptMock
    }
  });

  test('should happy scrap', async function() {
    this.disk[path.resolve('test-43-input.json')] = {
      content: JSON.stringify([
        { 
          "url": "http://example.com/test-3872" 
        },
        { 
          "url": "http://example.com/test-3873" 
        }
      ])
    }
    const options = { 
      dataset: 'test-43-input.json', 
      output: 'test-output.json', 
      script: 'script.js', 
      query: '$[*]',
    };
    await scrap(options, this.dependencies)

    const output = JSON.parse(await this.dependencies.fsAsync.readFile(path.resolve('test-output.json')))
    expect(output).toMatchObject([
      { url: 'http://example.com/test-3872', tested: true },
      { url: 'http://example.com/test-3873', tested: true }
    ])

    expect(this.dependencies.console.getLogs('log', /The job is done/)).toContain('The job is don')
  });

  test('should track scraping progress', async function() {
    this.disk[path.resolve('test-40-input.json')] = {
      content: JSON.stringify([
        { url: 'http://example.com/test-0871' },
        { url: 'http://example.com/test-0872'},
        { url: 'http://example.com/test-0873'},
      ])
    }
    const options = { 
      dataset: 'test-40-input.json', 
      output: 'test-output.json', 
      script: 'script.js', 
      query: '$[*]',
      delay: 1
    };
    await scrap(options, this.dependencies)

    expect(this.dependencies.console.getLogs('log', /Scraping the web/)).toMatch(/[\S\s]*\(1\/3\)[\S\s]*\(2\/3\)[\S\s]*\(3\/3\)[\S\s]*/)
  });


  test('should limit scraping', async function() {
    this.disk[path.resolve('test-48-input.json')] = {
      content: JSON.stringify(Array(100).fill(1).map(a => ({})))
    }
    const options = { 
      dataset: 'test-48-input.json', 
      output: 'test-output.json', 
      script: 'script.js', 
      query: '$[*]',
      delay: 1,
      limit: 5
    };
    await scrap(options, this.dependencies)

    expect(this.dependencies.console.getLogs('log', /Scraping the web/).split("\n").pop()).toContain("(5/100)")
  });

  test('should estimate scraping time', async function() {
    this.scriptMock = async (page, dataset) => {
      await new Promise(done => setTimeout(done, 100))
      return dataset
    }
    this.disk[path.resolve('test-44-input.json')] = {
      content: JSON.stringify(Array(100).fill(1).map(a => ({})))
    }
    const options = { 
      dataset: 'test-44-input.json', 
      output: 'test-output.json', 
      script: 'script.js', 
      query: '$[*]',
      delay: 1,
      limit: 10
    };
    await scrap(options, this.dependencies)

    const timeLog = this.dependencies.console.getLogs('log', /Scraping the web/).split("\n").pop()
    const timePattern = /(([0-9]+):([0-9]{2}):([0-9]{2}))/
    expect(timeLog).toMatch(timePattern)
    const timeMatch = timePattern.exec(timeLog)
    const h = Number(timeMatch[2])
    const m = Number(timeMatch[3])
    const s = Number(timeMatch[4])
    
    expect(h).toEqual(0)
    expect(h).toEqual(0)
    expect(s).toBeGreaterThanOrEqual(10)
    expect(s).toBeLessThanOrEqual(20)
  });

  test('should output to default location', async function() {
    this.disk[path.resolve('test-92-input.json')] = {
      content: JSON.stringify([ { "url": "http://example.com/test-9283"  } ])
    }
    const options = { 
      dataset: 'test-92-input.json', 
      script: 'script.js', 
      query: '$[*]',
    };
    await scrap(options, this.dependencies)
    const output = JSON.parse(await this.dependencies.fsAsync.readFile(path.resolve('output.json')))
    expect(output).toMatchObject([
      { url: 'http://example.com/test-9283', tested: true },
    ])
  });

  test('should run dryrun', async function() {
    this.disk[path.resolve('test-73-input.json')] = {
      content: JSON.stringify([ { "url": "http://example.com/test-0033"  } ])
    }
    const options = { 
      dataset: 'test-73-input.json', 
      script: 'script.js', 
      query: '$[*]',
      dryrun: true
    };
    await scrap(options, this.dependencies)
    expect(this.disk).not.toHaveProperty(path.resolve('output.json'))

    expect(this.dependencies.console.getLogs('log', /test-0033/)).toMatch(/test-0033/)
    
  });


});