const { Firestore } = require('@google-cloud/firestore')

class FirestoreCreator {
  /**
   * @param {string} projectId
   * @param {string} env
   * @param {string} host_port
   * @param {boolean} ssl
   * @return {object} - Firestore
   */
  static create ({
    projectId = process.env.GCP_PROJECT,
    env = process.env.NODE_ENV || 'development',
    hostAndPort = process.env.FIRESTORE_EMULATOR_HOST,
    ssl = null
  }) {
    const creator = new this({ projectId, env, hostAndPort, ssl })
    const opts = { projectId }
    if (hostAndPort) {
      opts.host = hostAndPort
      opts.ssl = creator.enableSsl
    }

    return new Firestore(opts)
  }

  constructor ({ projectId, env, hostAndPort, ssl }) {
    this.enableSsl = this.detectSsl({ env, hostAndPort, ssl })
  }

  /**
   * @param {string} env
   * @param {string} hostAndPort
   * @param {boolean} ssl
   * @return {boolean}
   */
  detectSsl ({ env, hostAndPort, ssl }) {
    if (ssl) return true

    if (typeof hostAndPort === 'string' && (hostAndPort.startsWith('::1') || hostAndPort.startsWith('127.0.0.1'))) {
      return false
    }

    if (env === 'production') {
      return true
    } else {
      return false
    }
  }
}

module.exports = FirestoreCreator
