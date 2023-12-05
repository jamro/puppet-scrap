
export const defaultScrapperOptions = {
  limit: Number.MAX_VALUE,
  delay: 500,
  query: '$',
  output: undefined,
  pretty: false,
  retry: false,
  silent: false,
}

export function fillDefaultOptions(options, defaults=defaultScrapperOptions) {
  if(options.dataset === undefined) {
    throw new Error('Missing parameter: options.dataset is required!')
  }
  if(options.script === undefined) {
    throw new Error('Missing parameter: options.script is required!')
  }

  const keys = Object.keys(defaults)
  for (let key of keys) {
    if(options[key] === undefined) {
      options[key] = defaults[key]
    }
  }

  return options
}
