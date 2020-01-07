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
    let emu, repo // eslint-disable-line no-unused-vars

    beforeEach(async () => {
      emu = Emulator.invoke('127.0.0.1', 9876)
      await sleep(2500)
      repo = RepositoryCreator.create('test-collection', 'test-project')
    })
    afterEach(async () => {
      await emu.kill()
    })
  })
})
