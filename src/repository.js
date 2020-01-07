class CollectionInvalid extends Error {
  get name () { return 'CollectionInvalid' }
}

class Repository {
  /**
   * @param {object} col - Firestore Collection
   */
  constructor (col) {
    if (typeof col === 'object' && col.firestore && col.path) {
      this._collection = col
    } else {
      throw new CollectionInvalid()
    }
  }

  /**
   * @return {object}
   */
  get col () {
    return this._collection
  }

  /**
   * @param {object} data
   * @return {object} - DocumentSnapshot
   */
  async add (data) {
    const documentRef = await this.col.add(data)
    return documentRef.get()
  }

  /** @alias add */
  async create (data) { return this.add(data) }

  /**
   * @return {Array} - {QueryDocumentSnapshot}s
   */
  async all () {
    const refs = await this.col.listDocuments()

    if (refs.length > 0) {
      return Promise.all(refs.map(async (ref) => ref.get()))
    } else {
      return []
    }
  }
}

module.exports = Repository
