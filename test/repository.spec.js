/* global describe, it, beforeEach, afterEach */

const Emulator = require('./emulator')
const sleep = require('sleep-promise')
const assert = require('power-assert')

const RepositoryCreator = require('repository-creator')
const Repository = require('repository')

describe('Repository', () => {
  const projectId = 'test-project'

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
      repo = RepositoryCreator.create('test-collection', { projectId })
    })
    afterEach(async () => {
      await emu.kill()
    })

    describe('#name', () => {
      it('return collection name', () => {
        repo = RepositoryCreator.create('test-collection', { projectId })
        assert.equal(repo.name, 'test-collection')
      })
    })

    describe('#add()', () => {
      const resource = { key: 'val' }

      describe('not unique', () => {
        beforeEach(async () => {
          await repo.add(resource)
          await repo.add(resource)
        })

        it('can be added same resources', async () => {
          assert.equal((await repo.all()).length, 2)
        })
      })

      describe('with single pk option', () => {
        beforeEach(async () => {
          repo = RepositoryCreator.create('test-collection', { projectId, pk: 'key' })
          await repo.add(resource)
        })
        describe('same resource given', () => {
          it('return false', async () => {
            assert.equal(await repo.add(resource), false)
          })
        })
        describe('different resource given', () => {
          it('success and length increased', async () => { // depends on order
            assert(await repo.add({ key: 'val different' }))
            assert.equal((await repo.all()).length, 2)
          })
        })
      })

      describe('with composite key', () => {
        const resource = { key1: 'val1', key2: 'val2', key3: 'abc' }
        const compositeKey = ['key1', 'key2']

        describe('WHOLE composite primary key matches', () => {
          beforeEach(async () => {
            repo = RepositoryCreator.create('test-collection', { projectId, pk: compositeKey })
            await repo.add(resource)
          })
          it('return false', async () => {
            assert.equal(await repo.add({ key1: 'val1', key2: 'val2', key3: 'def' }), false)
          })
        })
        describe('PART of composite primary key matches', () => {
          beforeEach(async () => {
            repo = RepositoryCreator.create('test-collection', { projectId, pk: compositeKey })
            await repo.add(resource)
          })
          it('added successfully', async () => {
            assert(await repo.add({ key1: 'val1', key2: 'val2.2', key3: 'def' }))
          })
        })
      })
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

    describe('#filter()', () => {
      describe('added', () => {
        const resource = { key: 'val' }
        const query = ['key', '==', 'val']
        let docs

        beforeEach(async () => {
          await repo.add(resource)
          docs = await repo.filter(repo.query.where(...query))
        })

        it('length is 1', () => {
          assert.equal(docs.length, 1)
        })
        it('return [{ key: `val` }]', () => {
          assert.deepEqual(docs.map((doc) => doc.data()), [resource])
        })
      })

      describe('not added', () => {
        it('return []', async () => {
          assert.deepEqual(await repo.filter(repo.query.where('id', '==', '1')), [])
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
