'use strict'

const {strictEqual} = require('assert')
const shared = require('shared-examples-for')

shared.examplesFor('TestMobile', function(test) {
  it('TestCheckWindow', async () => {
    const result = await test.eyes.checkWindow('Window')
    strictEqual(result.getAsExpected(), true)
  })
})

module.exports.TestMobile = shared
