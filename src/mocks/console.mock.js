export default function getConsoleMock () {
  const mock = {
    history: []
  }

  Object.keys(console)
    .filter(k => typeof(console[k]) == 'function')
    .reduce((mock, key) => {
      mock[key] = (...args) => {
        mock.history.push({method: key, args})
      }; 
      return mock;
    }, mock)

  mock.getLogs = (level='log', pattern=/.*/) => {
    return mock.history
      .filter(h => h.method === level)
      .map(h => typeof(h.args[0]) === 'object' ? JSON.stringify(h.args[0]) : h.args[0])
      .filter(h => pattern.test(h))
      .join("\n")
  }

  return mock
}