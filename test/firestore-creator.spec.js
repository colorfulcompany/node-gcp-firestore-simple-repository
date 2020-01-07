/* global describe, it, beforeEach, afterEach */

const assert = require('power-assert')
const Emulator = require('./emulator')

const FirestoreCreator = require('firestore-creator')

describe('FirestoreCreator', function () {
  this.timeout(5000)

  const host = '127.0.0.1'
  const port = 9876
  const projectId = 'test'
  let emu

  describe('.create', () => {
    describe('for development ( env var required )', () => {
      let store

      beforeEach(() => {
        process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
        store = FirestoreCreator.create(projectId)
      })
      afterEach(() => {
        process.env.FIRESTORE_EMULATOR_HOST = undefined
      })

      it('return Firestore instance', () => {
        assert.equal(store.constructor.name, 'Firestore')
      })

      it('customHeaders added', () => {
        assert(
          Object.keys(store._settings.customHeaders).indexOf('Authorization') !== -1
        )
      })
    })

    describe('for production', () => {
      it('customHeaders not added', () => {
        assert(
          Object.keys(FirestoreCreator.create()._settings).indexOf('Authorization') === -1
        )
      })
    })
  })

  describe('connect emulator indeed', () => {
    beforeEach((done) => {
      emu = Emulator.invoke(host, port)
      setTimeout(done, 2500)
    })
    afterEach(async () => {
      await emu.kill()
    })

    it('empty collections', async () => {
      const store = FirestoreCreator.create(projectId)
      assert.deepEqual(await store.listCollections(), [])
    })
  })
})
