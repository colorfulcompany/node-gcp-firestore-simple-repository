const execa = require('execa')
const kill = require('tree-kill')

class Emulator {
  /**
   * @param {string} host
   * @param {string} port
   * @return {execa}
   */
  static invoke (host, port) {
    const hostAndPort = [host, port].join(':')
    process.env.FIRESTORE_EMULATOR_HOST = hostAndPort

    const proc = execa('gcloud', ['beta', 'emulators', 'firestore', 'start', '--host-port', hostAndPort])

    return new this(proc)
  }

  /**
   * @param {execa} emu
   */
  constructor (proc) {
    this.proc = proc
  }

  /**
   * @return {Promise}
   */
  async kill () {
    return new Promise((resolve, reject) => {
      kill(this.proc.pid, (err) => reject(err))
      process.env.FIRESTORE_EMULATOR_HOST = undefined
      resolve(true)
    })
  }
}

module.exports = Emulator
