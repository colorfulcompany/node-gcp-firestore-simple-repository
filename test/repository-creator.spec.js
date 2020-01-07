/* global describe, it, beforeEach, afterEach */

const assert = require('power-assert')
const sleep = require('sleep-promise')
const Emulator = require('./emulator')

const RepositoryCreator = require('repository-creator')

describe('RepositoryCreator', () => {
  const host = '127.0.0.1'
  const port = 9876
  const projectId = 'test'
  let emu

  describe('with emulator', function () {
    this.timeout(20000)

    beforeEach(async () => {
      emu = Emulator.invoke(host, port)
      await sleep(2500)
    })
    afterEach(async () => {
      await emu.kill()
    })

    describe('given valid object', () => {
      let repo

      beforeEach(() => {
        repo = RepositoryCreator.create('testC', projectId)
      })

      it('return Repository instance', () => {
        assert.equal(repo.constructor.name, 'Repository')
        assert.equal(repo.col.constructor.name, 'CollectionReference')
      })

      it('documents is empty', async () => {
        assert.deepEqual(await repo.col.listDocuments(), [])
      })

      it('#add() return Doc', async function () {
        const doc = await repo.add({ key: 'val' })
        assert.deepEqual(doc.data(), { key: 'val' })
      })
    })
  })

  describe('without emulator', () => {
    let emuHost
    beforeEach(() => {
      emuHost = process.env.FIRESTORE_EMULATOR_HOST
      process.env.FIRESTORE_EMULATOR_HOST = undefined
    })
    afterEach(() => {
      process.env.FIRESTORE_EMULATOR_HOST = emuHost
    })

    it('#add rejected', async () => {
      const repo = RepositoryCreator.create('testC', projectId)
      assert.rejects(
        async () => repo.add({ key: 'val' })
      )
    })
  })
})