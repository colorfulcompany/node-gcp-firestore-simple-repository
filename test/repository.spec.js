/* global describe, it, beforeEach, afterEach */

const Emulator = require('./emulator')
const sleep = require('sleep-promise')
const assert = require('power-assert')

const RepositoryCreator = require('repository-creator')
const Repository = require('repository')

describe('Repository', () => {
  describe('not collection object', () => {
    it('throw CollectionInvalid error', () => {
      assert.throws(
        () => new Repository({}),
        { name: 'CollectionInvalid' }
      )
    })
  })

  describe('regular initialized', function () {
    this.timeout(20000)
    let emu, repo

    beforeEach(async () => {
      emu = Emulator.invoke('127.0.0.1', 9876)
      await sleep(2500)
      repo = RepositoryCreator.create('test-collection', 'test-project')
    })
    afterEach(async () => {
      await emu.kill()
    })

    describe('#name', () => {
      it('return collection name', async () => {
        const repo = await RepositoryCreator.create('test-collection', 'test-project')
        assert.equal(repo.name, 'test-collection')
      })
    })

    describe('#add()', () => {
    })

    describe('#create()', () => {
    })

    describe('#delete()', () => {
      describe('after added', () => {
        const resource = { key: 'val' }
        let id

        beforeEach(async () => {
          await repo.add(resource)
          const docs = await repo.all()
          id = docs[0].id
        })

        it('return WriteResult', async () => {
          assert.equal((await repo.delete(id)).constructor.name, 'WriteResult')
        })
      })

      describe('not exists', () => {
        it('return false', async () => {
          assert.equal(await repo.delete('abc'), false)
        })
      })
    })

    describe('#all()', () => {
      describe('empty', () => {
        it('[]', async () => {
          const docs = await repo.all()
          assert.deepEqual(docs, [])
        })
      })

      describe('after added', () => {
        const resource = { key: 'val' }
        let docs

        beforeEach(async () => {
          await repo.add(resource)
          docs = await repo.all()
        })

        it('QueryDocumentSnapshot', () => {
          assert.equal(docs[0].constructor.name, 'QueryDocumentSnapshot')
        })
        it('.data() return original', () => {
          assert.deepEqual(docs[0].data(), resource)
        })
        it('.id', () => {
          assert(typeof docs[0].id === 'string')
        })
      })
    })

    describe('#find()', () => {
      describe('after added', () => {
        const resource = { key: 'val' }
        let docSnapshot
        beforeEach(async () => {
          const docRef = await repo.add(resource)
          docSnapshot = await repo.find(docRef.id)
        })

        it('return QueryDocumentSnapshot', async () => {
          assert.equal(docSnapshot.constructor.name, 'QueryDocumentSnapshot')
        })
        it('.data() for raw data', () => {
          assert.deepEqual(docSnapshot.data(), resource)
        })
      })

      describe('not exists', () => {
        it('return undefined', async () => {
          assert.equal(await repo.find('abc'), undefined)
        })
      })
    })

    describe('#first()', () => {
    })

    describe('#last()', () => {
    })

    describe('#clear()', () => {
    })
  })
})
