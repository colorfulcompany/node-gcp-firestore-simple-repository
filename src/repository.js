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
      const query = this.queryForPksWith(data)
      const docs = await this.filter(query)
      if (docs.length > 0) return false
    }

    const documentRef = await this.col.add(data)
    return documentRef.get()
  }

  /**
   * @param {string|object} targe
   * @param {object|false} newData
   * @param {object} opts
   */
  async update (target, newData, opts = {}) {
    let curr

    if (typeof target === 'string') {
      curr = await this.find(target)
    } else {
      curr = target
    }

    if (curr) {
      // normalize to documentReference
      if (typeof curr.set === 'undefined' && typeof curr.ref !== 'undefined') {
        curr = curr.ref
      }
      return curr.set(newData, opts)
    } else {
      return false
    }
  }

  /**
   * query object from current data and this.opts.pk
   *
   * @param {object} data
   * @return {object} - Query
   */
  queryForPksWith (data) {
    const pks = (typeof this.opts.pk === 'string') ? [this.opts.pk] : this.opts.pk

    return pks.reduce((query, pk) => {
      return (typeof data[pk] !== 'undefined')
        ? query.where(pk, '==', data[pk])
        : query
    }, this.query)
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
