'use strict'

require('chromedriver')
const assert = require('assert')
const assertRejects = require('assert-rejects')
const {Builder, By, Capabilities} = require('selenium-webdriver')
const {Options: ChromeOptions} = require('selenium-webdriver/chrome')
const {GeneralUtils} = require('@applitools/eyes-common')

const {
  Eyes,
  Target,
  RectangleSize,
  NewTestError,
  DiffsFoundError,
  TestResults,
} = require('../../index')

let /** @type {WebDriver} */ driver, /** @type {Eyes} */ eyes
let /** @type {string} */ appName,
  /** @type {string} */ testName,
  /** @type {RectangleSize} */ viewportSize
describe('Server Status', () => {
  before(async function() {
    driver = await new Builder()
      .withCapabilities(Capabilities.chrome())
      .setChromeOptions(new ChromeOptions().headless().addArguments('disable-infobars'))
      .build()

    eyes = new Eyes()
    appName = this.test.parent.title
    testName = `TestSessionSummary_${GeneralUtils.guid()}`
    viewportSize = new RectangleSize(800, 600)

    await driver.get('https://applitools.com/helloworld')
  })

  it('TestSessionSummary_Status_New', async () => {
    eyes.setSaveNewTests(false)
    driver = await eyes.open(driver, appName, testName, viewportSize)

    await eyes.check('A new window', Target.window())

    await assertRejects(eyes.close(), NewTestError, 'Expected NewTestError')
  })

  it('TestSessionSummary_Status_Passed', async () => {
    eyes.setSaveNewTests(true)
    driver = await eyes.open(driver, appName, testName, viewportSize)

    await eyes.check('A window', Target.window())

    const results = await eyes.close()
    assert.ok(results instanceof TestResults)
    assert.ok(results.getIsNew())
  })

  it('TestSessionSummary_Status_Failed', async () => {
    driver = await eyes.open(driver, appName, testName, viewportSize)

    await driver.findElement(By.css('button')).click()
    await eyes.check('A window', Target.window())

    await assertRejects(eyes.close(), DiffsFoundError, 'Expected DiffsFoundError')
  })

  afterEach(async () => {
    await eyes.abort()
  })

  after(async () => {
    await driver.quit()
  })
})
