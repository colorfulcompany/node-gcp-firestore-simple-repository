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
    const ref = await this.col.add(data)
    return ref.get()
  }

  /** @alias */
  async create (data) { return this.add(data) }
}

module.exports = Repository
