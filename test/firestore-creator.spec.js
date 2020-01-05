/* global describe, it, beforeEach, afterEach */

const execa = require('execa')
const kill = require('tree-kill')
const assert = require('power-assert')

const FirestoreCreator = require('firestore-creator')

describe('FirestoreCreator', () => {
  const host = '127.0.0.1'
  const port = 9876
  let emu

  function invokeEmu () {
    const hostAndPort = [host, port].join(':')
    process.env.FIRESTORE_EMULATOR_HOST = hostAndPort
    return execa('gcloud', ['beta', 'emulators', 'firestore', 'start', '--host-port', hostAndPort])
  }

  async function killEmu (emu) {
    return new Promise((resolve, reject) => {
      kill(emu.pid, (err) => reject(err))
      delete process.env.FIRESTORE_EMULATOR_HOST
      resolve(true)
    })
  }

  describe('.create', () => {
    describe('for development ( env var required )', () => {
      let store

      beforeEach(() => {
        process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
        store = FirestoreCreator.create({})
      })
      afterEach(() => {
        delete process.env.FIRESTORE_EMULATOR_HOST
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
          Object.keys(FirestoreCreator.create({})._settings).indexOf('Authorization') === -1
        )
      })
    })
  })

  describe('connect emulator indeed', () => {
    beforeEach(function (done) {
      this.timeout(3000)
      emu = invokeEmu()
      setTimeout(done, 2500)
    })
    afterEach(async () => {
      await killEmu(emu)
    })

    it('empty collections', async () => {
      const store = FirestoreCreator.create({
        projectId: 'test',
        hostAndPort: [host, port].join(':')
      })
      assert.deepEqual(await store.listCollections(), [])
    })
  })
})
