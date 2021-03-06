'use strict'
const assert = require('assert')
const {Target, Configuration} = require('../../../index')
const {getDriver, getEyes, getBatch} = require('./util/TestSetup')
const batch = getBatch()
describe('TestCounts', () => {
  let driver, eyes, runner
  beforeEach(async () => {
    driver = await getDriver('CHROME')
    await driver.get('https://applitools.com/helloworld')
    ;({eyes, runner} = await getEyes('VG'))
    await eyes.setSendDom(false)
  })

  it('Test_VGTestsCount_1', async () => {
    await eyes.setBatch(batch)
    await eyes.setBranchName('master')
    await eyes.open(driver, 'Test Count', 'Test_VGTestsCount_1', {width: 640, height: 480})
    await eyes.check('Test', Target.window())
    await eyes.close()
    let results = await runner.getAllTestResults()
    assert.deepStrictEqual(1, results.getAllResults().length)
  })

  it('Test_VGTestsCount_2', async () => {
    let conf = new Configuration()
    conf.setBatch(batch)
    conf.addBrowser(900, 600)
    conf.addBrowser(1024, 768)
    conf.setBranchName('master')
    eyes.setConfiguration(conf)
    await eyes.open(driver, 'Test Count', 'Test_VGTestsCount_2')
    await eyes.check('Test', Target.window())
    await eyes.close()
    let results = await runner.getAllTestResults()
    assert.deepStrictEqual(2, results.getAllResults().length)
  })

  it('Test_VGTestsCount_3', async () => {
    let conf = new Configuration()
    conf.setBatch(batch)
    conf.addBrowser(900, 600)
    conf.addBrowser(1024, 768)
    conf.setAppName('Test Count')
    conf.setTestName('Test_VGTestsCount_3')
    conf.setBranchName('master')
    eyes.setConfiguration(conf)
    await eyes.open(driver)
    await eyes.check('Test', Target.window())
    await eyes.close()
    let results = await runner.getAllTestResults()
    assert.deepStrictEqual(2, results.getAllResults().length)
  })

  it('Test_VGTestsCount_4', async () => {
    let conf = new Configuration()
    conf.setBatch(batch)
    conf.setAppName('Test Count')
    conf.setTestName('Test_VGTestsCount_4')
    conf.setBranchName('master')
    eyes.setConfiguration(conf)
    await eyes.open(driver)
    await eyes.check('Test', Target.window())
    await eyes.close()
    let results = await runner.getAllTestResults()
    assert.deepStrictEqual(1, results.getAllResults().length)
  })

  it('Test_VGTestsCount_5', async () => {
    let conf = new Configuration()
    conf.setBatch(batch)
    conf.addBrowser(900, 600)
    conf.addBrowser(1024, 768)
    conf.setBranchName('master')
    eyes.setConfiguration(conf)
    await eyes.open(driver, 'Test Count', 'Test_VGTestsCount_5', {width: 640, height: 480})
    await eyes.check('Test', Target.window())
    await eyes.close()
    let results = await runner.getAllTestResults()
    assert.deepStrictEqual(2, results.getAllResults().length)
  })

  afterEach(async () => {
    await driver.quit()
    await eyes.abortIfNotClosed()
  })
})
