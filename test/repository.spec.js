/* global describe, it */

const assert = require('power-assert')

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
})
