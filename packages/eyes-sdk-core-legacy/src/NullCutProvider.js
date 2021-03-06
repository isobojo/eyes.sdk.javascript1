;(function() {
  'use strict'

  var FixedCutProvider = require('./FixedCutProvider').FixedCutProvider

  /**
   * @constructor
   * @augments FixedCutProvider
   */
  function NullCutProvider() {
    FixedCutProvider.call(this, 0, 0, 0, 0)
  }

  NullCutProvider.prototype = Object.create(FixedCutProvider.prototype)
  NullCutProvider.prototype.constructor = NullCutProvider

  exports.NullCutProvider = NullCutProvider
})()
