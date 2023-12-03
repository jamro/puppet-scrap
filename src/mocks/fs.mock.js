export default class fsMock {

  constructor(state = {}) {
    this.state = state
  }

  existsSync(path) {
    return Object.keys(this.state).includes(path)
  }

}