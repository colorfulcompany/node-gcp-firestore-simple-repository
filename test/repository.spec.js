/* global describe, it, beforeEach, afterEach */

const EmulatorController = require('emulator-controller')
const sleep = require('sleep-promise')
const sinon = require('sinon')
const assert = require('power-assert')

const RepositoryCreator = require('repository-creator')
const Repository = require('repository')

const { GoogleAuth, auth } = require('google-auth-library') // eslint-disable-line no-unused-vars

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

  describe('Could not load the default credentials.', () => {
    beforeEach(() => {
      sinon.stub(auth, 'getApplicationDefaultAsync').throws('Could not load the default credentials.')
    })
    afterEach(() => sinon.restore())

    it('rejected', async () => {
      try {
        const repo = RepositoryCreator.create('test-collection', { projectId })
        await repo.all()
      } catch (e) {
        console.log('---\n')
        console.log(e.message)
        console.log('---\n')
        console.log(e)
      }
    })
  })

  describe('regular initialized', function () {
    this.timeout(20000)
    let emu, repo

    before(async () => { // eslint-disable-line no-undef
      emu = EmulatorController.invoke('127.0.0.1', 9876)
      await sleep(2500)
    })
    after(async () => { // eslint-disable-line no-undef
      await emu.kill()
    })
    beforeEach(() => {
      repo = RepositoryCreator.create('test-collection', { projectId })
    })
    afterEach(async () => {
      await repo.clear()
    })

    describe('#TRANSACTION_LIMIT', () => {
      it('500', () => {
        repo = RepositoryCreator.create('test-collection', { projectId })
        assert.equal(repo.TRANSACTION_LIMIT, 500)
      })
    })

    describe('#batch()', () => {
      it('', () => {
        repo = RepositoryCreator.create('test-collection', { projectId })
        assert.equal(repo.batch().constructor.name, 'WriteBatch')
      })
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
          assert.equal(await repo.size(), 2)
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
            assert.equal(await repo.size(), 2)
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

    describe('#update()', () => {
      const initialResource = { key: 'val' }
      const updateTo = { key: 'val2' }

      describe('simple update', () => {
        let origDoc
        beforeEach(async () => {
          origDoc = await repo.add(initialResource)
        })
        describe('given documentReference', () => {
          it('return Result and ref modified', async () => {
            const docRef = origDoc.ref
            await repo.update(docRef, updateTo)
            assert.deepEqual((await docRef.get()).data(), updateTo)
          })
        })
        describe('given documentSnapshot', () => {
          it('need find to get updated doc', async () => {
            await repo.update(origDoc, updateTo)
            assert.deepEqual((await repo.find(origDoc.id)).data(), updateTo)
          })
        })
        describe('given doc id', () => {
          it('need find to get updated doc', async () => {
            const id = origDoc.id
            await repo.update(id, updateTo)
            assert.deepEqual((await repo.find(id)).data(), updateTo)
          })
        })
      })

      describe('merge update', () => {
        const set1 = { key: 'val1' }
        const set2 = { key2: 'val2' }
        let doc

        beforeEach(async () => {
          doc = await repo.add(set1)
        })
        describe('not merge', () => {
          it('replace key-val', async () => {
            await repo.update(doc.ref, set2)
            assert.deepEqual((await doc.ref.get()).data(), set2)
          })
        })
        describe('merge true', () => {
          it('', async () => {
            await repo.update(doc.ref, set2, { merge: true })
            assert.deepEqual((await doc.ref.get()).data(), { ...set1, ...set2 })
          })
        })
      })

      describe('primary key constraint', () => {
        const initialResource = { key: 'val' }
        const updateTo = { key: 'val2' }
        let doc

        describe('no constraints', () => {
          beforeEach(async () => {
            await repo.add(updateTo)
            doc = await repo.add(initialResource)
          })
          it('not unique', async () => {
            await repo.update(doc, updateTo)
            const docs = (await repo.all()).map((doc) => {
              return doc.data()
            })
            assert.deepEqual(docs, [updateTo, updateTo])
          })
        })
        describe('with primary key constraint', () => {
          describe('replace', () => {
            beforeEach(async () => {
              repo = RepositoryCreator.create('test-collection', { projectId, pk: 'key' })
              await repo.add(updateTo)
              doc = await repo.add(initialResource)
            })
            it('update failed', async () => {
              assert.equal(await repo.update(doc, updateTo), false)
              assert.deepEqual(doc.data(), initialResource)
            })
          })
        })
        describe('merge update and constraint', () => {
          const initialResource1 = { key1: 'val', key2: 'val2', key3: 'val3' }
          const initialResource2 = { key1: 'val1', key2: 'val2', key3: 'val2' }
          let docRef2

          beforeEach(async () => {
            repo = RepositoryCreator.create('test-collection', { projectId, pk: ['key1', 'key2'] })
            await repo.add(initialResource1)
            docRef2 = (await repo.add(initialResource2)).ref
          })

          describe('partial ( key1 only ) match with primary key', () => {
            it('succeed', async () => {
              assert(await repo.update(
                docRef2, { key1: 'val', key2: 'val' }, { merge: true }))
            })
          })
          describe('whole match with primary key', () => {
            it('fail', async () => {
              assert.equal(
                await repo.update(docRef2, { key1: 'val' }, { merge: true }),
                false
              )
            })
          })
        })
      })
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

        it('return Transaction', async () => {
          assert.equal((await repo.delete(id)).constructor.name, 'Transaction')
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
      describe('2 added', () => {
        beforeEach(async () => {
          await repo.add({})
          await repo.add({})
        })
        it('size 2 -> 0', async () => {
          assert.equal(await repo.size(), 2)
          await repo.clear()
          assert.equal(await repo.size(), 0)
        })
      })
      describe('no added', () => {
        it('normally complete', async () => {
          assert(await repo.clear())
        })
      })

      describe('over 500 documents', function () {
        beforeEach(async () => {
          const data = []
          for (let i = 0; i <= 500; i++) data.push({ id: i + '' })
          await repo.bulkLoad(data, 'id')
        })
        it('clear successfully', async () => {
          assert.equal(await repo.size(), 501)
          assert(await repo.clear())
          assert.equal(await repo.size(), 0)
        })
      })
    })

    describe('#bulkLoad()', () => {
      describe('same data', () => {
        it('rejected', () => {
          assert.rejects(
            async () => repo.bulkLoad([{ id: '1' }, { id: '1' }], 'id')
          )
        })
      })
    })
  })
})
