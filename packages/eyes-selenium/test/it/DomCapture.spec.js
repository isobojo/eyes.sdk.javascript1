'use strict'

const {describe, it, before} = require('mocha')
const {expect} = require('chai')
const {EyesSelenium, Target, Logger, ConsoleLogHandler} = require('../../')
const {Builder, By} = require('selenium-webdriver')
const {Options} = require('selenium-webdriver/chrome')
const fakeEyesServer = require('@applitools/sdk-fake-eyes-server')
const logger = new Logger(process.env.APPLITOOLS_SHOW_LOGS)
const path = require('path')
const fetch = require('node-fetch')
const zlib = require('zlib')
const fs = require('fs')

describe('DOM Capture', () => {
  let driver, eyes, serverUrl, closeServer
  const expectedFolder = path.resolve(__dirname, '../fixtures/tmp')

  before(async () => {
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(new Options().headless())
      .build()

    if (!fs.existsSync(expectedFolder)) {
      fs.mkdirSync(expectedFolder)
    }

    const {port, close} = await fakeEyesServer({
      logger,
      updateFixtures: true,
      expectedFolder,
    })
    serverUrl = `http://localhost:${port}`
    closeServer = close
  })

  after(async () => {
    fs.rmdirSync(expectedFolder, {recursive: true})
    await closeServer()
    await driver.quit()
  })

  beforeEach(async function() {
    eyes = new EyesSelenium()
    eyes.setServerUrl(serverUrl)
    if (process.env.APPLITOOLS_SHOW_LOGS) {
      eyes.setLogHandler(new ConsoleLogHandler(true))
    }

    await driver.get('https://applitools.github.io/demo/TestPages/FramesTestPage/')
  })

  it('gets the correct coordinates when taking a viewport screenshot and not scrolled', async () => {
    await eyes.open(driver, 'DOM capture', 'viewport 0,0', {
      width: 500,
      height: 500,
    }) // this width causes horizontal scroll on the page

    await driver.executeScript('window.scrollTo(0,0)')
    await eyes.check('', Target.window())
    const testResults = await eyes.close()
    const runningSession = await getRunningSession(testResults.getId())
    const dom = await getDom(runningSession)
    expect(dom.rect.top).to.equal(0)
    expect(dom.rect.left).to.equal(0)
    expect(runningSession.steps[0].matchWindowData.appOutput.location).to.eql({x: 0, y: 0})
  })

  it('gets the correct coordinates when taking a viewport screenshot even when scrolled', async () => {
    await eyes.open(driver, 'DOM capture', 'viewport 30,30', {
      width: 500,
      height: 500,
    }) // this width causes horizontal scroll on the page

    await driver.executeScript('window.scrollTo(30,30)')
    await eyes.check('', Target.window())
    const testResults = await eyes.close()
    const runningSession = await getRunningSession(testResults.getId())
    const dom = await getDom(runningSession)
    expect(dom.rect.top).to.equal(-30)
    expect(dom.rect.left).to.equal(-30)
    expect(runningSession.steps[0].matchWindowData.appOutput.location).to.eql({x: 0, y: 0})
  })

  it('gets the correct coordinates when taking a full page screenshot and not scrolled', async () => {
    await eyes.open(driver, 'DOM capture', 'full page 0,0', {
      width: 500,
      height: 500,
    }) // this width causes horizontal scroll on the page

    await driver.executeScript('window.scrollTo(0,0)')
    await eyes.check('', Target.window().fully())
    const testResults = await eyes.close()
    const runningSession = await getRunningSession(testResults.getId())
    const dom = await getDom(runningSession)
    expect(dom.rect.top).to.equal(0)
    expect(dom.rect.left).to.equal(0)
    expect(runningSession.steps[0].matchWindowData.appOutput.location).to.eql({x: 0, y: 0})
  })

  it('gets the correct coordinates when taking a full page screenshot even when scrolled', async () => {
    await eyes.open(driver, 'DOM capture', 'full page 30,30', {
      width: 500,
      height: 500,
    }) // this width causes horizontal scroll on the page

    await driver.executeScript('window.scrollTo(30,30)')
    debugger
    await eyes.check('', Target.window().fully())
    const testResults = await eyes.close()
    const runningSession = await getRunningSession(testResults.getId())
    const dom = await getDom(runningSession)
    expect(dom.rect.top).to.equal(0)
    expect(dom.rect.left).to.equal(0)
    expect(runningSession.steps[0].matchWindowData.appOutput.location).to.eql({x: 0, y: 0})
  })

  it('gets the correct coordinates when taking a region screenshot and not scrolled', async () => {
    await eyes.open(driver, 'DOM capture', 'region 0,0', {
      width: 500,
      height: 500,
    }) // this width causes horizontal scroll on the page

    await driver.executeScript('window.scrollTo(0,0)')
    const el = await driver.findElement(By.css('#overflowing-div'))
    await eyes.check('', Target.region(el).fully())
    const expectedRect = await getEffectiveLocation(el)
    const testResults = await eyes.close()
    const runningSession = await getRunningSession(testResults.getId())
    const dom = await getDom(runningSession)
    expect(dom.rect.top).to.equal(0)
    expect(dom.rect.left).to.equal(0)
    expect(runningSession.steps[0].matchWindowData.appOutput.location).to.eql({
      x: expectedRect.x,
      y: expectedRect.y,
    })
  })

  it.skip('gets the correct coordinates when taking a region screenshot even when scrolled', async () => {
    await eyes.open(driver, 'DOM capture', 'region 0,0', {
      width: 500,
      height: 500,
    }) // this width causes horizontal scroll on the page

    await driver.executeScript('window.scrollTo(0,0)')
    const el = await driver.findElement(By.css('#overflowing-div'))
    await eyes.check('', Target.region(el).fully())
    const expectedRect = await getEffectiveLocation(el)
    const testResults = await eyes.close()
    const runningSession = await getRunningSession(testResults.getId())
    const dom = await getDom(runningSession)
    expect(dom.rect.top).to.equal(0)
    expect(dom.rect.left).to.equal(0)
    expect(runningSession.steps[0].matchWindowData.appOutput.location).to.eql({
      x: expectedRect.x,
      y: expectedRect.y,
    })
  })

  it.skip('gets the correct coordinates when taking a full element screenshot even when the element and the page are scrolled', async () => {})

  it.skip('gets the correct coordinates when taking a region screenshot inside a frame', async () => {})

  it.skip("gets the correct coordinates when taking a region screenshot inside a frame that's scrolled", async () => {})

  // TODO utilities for fake server, i.e. a way to observe inputs
  function getRunningSession(sessionId) {
    return fetch(`${serverUrl}/api/sessions/running/${sessionId}`).then(r => r.json())
  }

  async function getDom(runningSession) {
    const compressedDom = await fetch(
      runningSession.steps[0].matchWindowData.appOutput.domUrl,
    ).then(r => r.buffer())

    return JSON.parse(zlib.unzipSync(compressedDom).toString())
  }

  // TODO this should be a central utility also for production code (well, modified for cross browser compat and optimize to get also dimensions), not only tests!
  async function getEffectiveLocation(el) {
    const rect = await el.getRect()
    const [borderLeft, borderTop] = await el
      .getDriver()
      .executeScript(
        'const style = getComputedStyle(arguments[0]); return [style.borderLeftWidth, style.borderTopWidth];',
        el,
      )

    // TODO there's obviously a bug here. Math.ceil should be applied only to the result. But this is how the SDK does it today. Actually it should also be Math.round and not Math.ceil
    return {
      x: Math.ceil(rect.x) + Math.ceil(borderLeft.replace('px', '')),
      y: Math.ceil(rect.y) + Math.ceil(borderTop.replace('px', '')),
    }
  }
})
