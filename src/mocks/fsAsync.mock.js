export default class fsAsyncMock {

  constructor(state = {}) {
    this.state = state
  }

  async readFile(path) {
    if(!this.state[path]) {
      throw new Error(`fsAsyncMock: file at ${path} not found`)
    }
    return this.state[path].content
  }

  async writeFile(path, content) {
    this.state[path] = { content }
  }

  async unlink(path) {
    delete this.state[path]
  }
}