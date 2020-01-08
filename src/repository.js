class CollectionInvalid extends Error {
  get name () { return 'CollectionInvalid' }
}

class Repository {
  /**
   * @param {object} col - Firestore Collection
   */
  constructor (col, opts = {}) {
    if (typeof col === 'object' && col.firestore && col.path) {
      this._collection = col
      this.opts = opts
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
   * query interface for collection
   *
   * @alias col
   */
  get query () {
    return this.col
  }

  /**
   * @return {string}
   */
  get name () {
    return this.col.path
  }

  /**
   * @param {object} data
   * @return {object|false} - DocumentSnapshot
   */
  async add (data) {
    if (typeof this.opts.pk !== 'undefined') {
      const pkVal = data[this.opts.pk]
      if (typeof pkVal !== 'undefined') {
        const docs = await this.filter(this.query.where(this.opts.pk, '==', pkVal))
        if (docs.length > 0) return false
      }
    }

    const documentRef = await this.col.add(data)
    return documentRef.get()
  }

  /** @alias add */
  async create (data) { return this.add(data) }

  /**
   * @param {string} id
   * @return {object|false} - WriteResult
   */
  async delete (id) {
    const docSnapshot = await this.find(id)

    return docSnapshot && docSnapshot.exists
      ? docSnapshot.ref.delete()
      : false
  }

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

  /**
   * @param {string} id
   * @return {object|undefined} - {QueryDocumentSnapshot}
   */
  async find (id) {
    const docRef = this.col.doc(id)
    const docSnapshot = await docRef.get()

    return docSnapshot.exists ? docSnapshot : undefined
  }

  /**
   * @param {object} query - {Query}
   * @return {Array} - of {QueryDocumentSnapshot}
   */
  async filter (query) {
    return (await query.get()).docs
  }
}

module.exports = Repository
