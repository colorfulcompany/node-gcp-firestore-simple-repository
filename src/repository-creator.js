const FirestoreCreator = require('./firestore-creator')
const Repository = require('./repository')

class RepositoryCreator {
  /**
   * @param {string} collection
   * @param {string} projectId
   * @param {object} opts
   * @return {object} - Firestore
   */
  static create (collection, { projectId = process.env.GCP_PROJECT, ...opts } = {}) {
    this._last_collection = collection
    this._last_projectId = projectId
    this._last_opts = opts

    const store = FirestoreCreator.create(projectId)

    return new Repository(store.collection(collection), opts)
  }
}

module.exports = RepositoryCreator
