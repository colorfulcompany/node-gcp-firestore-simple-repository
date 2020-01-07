const FirestoreCreator = require('./firestore-creator')
const Repository = require('./repository')

class RepositoryCreator {
  /**
   * @param {string} collection
   * @param {string} projectId
   * @return {object} - Firestore
   */
  static create (collection, projectId = process.env.GCP_PROJECT) {
    const store = FirestoreCreator.create(projectId)

    return new Repository(store.collection(collection))
  }
}

module.exports = RepositoryCreator
