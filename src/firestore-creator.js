const { Firestore } = require('@google-cloud/firestore')

class FirestoreCreator {
  /**
   * @param {string} projectId
   * @return {object} - Firestore
   */
  static create (projectId = process.env.GCP_PROJECT) {
    return new Firestore({ projectId })
  }
}

module.exports = FirestoreCreator
