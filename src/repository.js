require('array.prototype.flat/auto')
const arrayChunks = require('lodash.chunk')
const sleep = require('sleep-promise')

class CollectionInvalid extends Error {
  get name () { return 'CollectionInvalid' }
}

const TRANSACTION_LIMIT = 500

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
   * @return {number}
   */
  get TRANSACTION_LIMIT () {
    return TRANSACTION_LIMIT
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
   * @return {object}
   */
  batch () {
    return this.col._firestore.batch()
  }

  /**
   * @param {Function} callback - with async
   */
  transaction (callback) {
    const db = this.col._firestore

    return db.runTransaction(async (t) => callback(t))
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
   * @return {Promise} - WriteResult
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

      if (typeof this.opts.pk !== 'undefined') {
        const rawCurr = (await curr.get()).data()
        const rawNext = (opts.merge) ? { ...rawCurr, ...newData } : newData
        const query = this.queryForPksWith(rawNext)
        const docs = await this.filter(query)
        if (docs.length > 0) return false
      }
      return this.transaction(async (t) => {
        return t.set(curr, newData, opts)
      })
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
    return this.transaction(async (t) => {
      const docSnapshot = await this.find(id)
      return docSnapshot && docSnapshot.exists
        ? t.delete(docSnapshot.ref)
        : false
    })
  }

  /**
   * @return {Array} - {QueryDocumentSnapshot}s
   */
  async all () {
    const refs = await this.col.listDocuments()

    return this.transaction(async (t) => {
      if (refs.length > 0) {
        return t.getAll(...refs)
      } else {
        return []
      }
    })
  }

  /**
   * @param {string} id
   * @return {object|undefined} - {QueryDocumentSnapshot}
   */
  async find (id) {
    return this.transaction(async (t) => {
      const docRef = this.col.doc(id)
      const docSnapshot = await t.get(docRef)

      return docSnapshot.exists ? docSnapshot : undefined
    })
  }

  /**
   * @param {object} query - {Query}
   * @return {Array} - of {QueryDocumentSnapshot}
   */
  async filter (query) {
    return this.transaction(async (t) => {
      return (await t.get(query)).docs
    })
  }

  /**
   * @return {number}
   */
  async size () {
    return (await this.col.get()).size
  }

  /**
   * @return {object} - WriteResult
   */
  async clear () {
    const col = this.col
    const results = []

    const refs = await col.listDocuments()
    await Promise.all(
      arrayChunks(refs, this.TRANSACTION_LIMIT).map(async (chunk) => {
        const batch = this.batch()
        chunk.map((ref) => batch.delete(ref))
        results.push(await batch.commit())
      }))

    return results.flat()
  }

  /**
   * @param {Array} data
   * @param {string} idColumn
   * @return {Array|boolean}
   */
  async bulkLoad (data, idColumn) {
    const results = []
    await Promise.all(
      arrayChunks(data, this.TRANSACTION_LIMIT).map(async (chunk) => {
        const batch = this.batch()
        chunk.map((datum) => {
          const docRef = this.col.doc(datum[idColumn])
          batch.create(docRef, datum)
        })
        results.push(await batch.commit())
        await sleep(1000)
      }))
    return (results.length) > 0 ? results.flat() : false
  }
}

module.exports = Repository
