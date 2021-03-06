'use strict'
const {sauceUrl, getBatch} = require('./util/TestSetup')
const {Eyes, EyesWebElement, Target, Region, StitchMode} = require('../../../index')
const {Builder, By} = require('selenium-webdriver')
const appName = 'TestScrolling'
const batch = getBatch()

describe(appName, () => {
  describe('ChromeEmulation', () => {
    let eyes, driver

    it('TestWebAppScrolling', async () => {
      driver = await new Builder()
        .withCapabilities({
          browserName: 'chrome',
          'goog:chromeOptions': {
            mobileEmulation: {
              deviceMetrics: {width: 360, height: 740, pixelRatio: 4},
              userAgent:
                'Mozilla/5.0 (Linux; Android 8.0.0; SM-G960F Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.137 Mobile Safari/537.36',
            },
            args: ['--window-size=360,740', 'headless'],
          },
        })
        .build()
      try {
        await driver.get('https://applitools.github.io/demo/TestPages/MobileDemo/adaptive.html')
        eyes = new Eyes()
        eyes.setBatch(batch)
        let eyesDriver = await eyes.open(driver, appName, `TestWebAppScrolling`, {
          width: 360,
          height: 740,
        })
        let element = await driver.findElement(By.css('.content'))
        let eyesElement = new EyesWebElement(eyes._logger, eyesDriver, element)
        let size = await eyesElement.getScrollSize()
        for (let currentPosition = 0; currentPosition < size.getHeight(); currentPosition += 6000) {
          let height = Math.min(6000, size.getHeight() - currentPosition)
          await eyes.check(
            'TestWebAppScrolling',
            Target.region(new Region(0, currentPosition, size.getWidth(), height))
              .fully()
              .scrollRootElement(element),
          )
        }
        await eyes.close()
      } finally {
        await eyes.abortIfNotClosed()
        await driver.quit()
      }
    })

    it('TestWebAppScrolling2', async () => {
      driver = await new Builder()
        .withCapabilities({
          browserName: 'chrome',
          'goog:chromeOptions': {
            mobileEmulation: {
              deviceMetrics: {width: 386, height: 512, pixelRatio: 4},
              userAgent:
                'Mozilla/5.0 (Linux; Android 7.1.1; Nexus 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
            },
            args: ['--window-size=386,512', 'headless'],
          },
        })
        .build()
      try {
        await driver.get('https://applitools.github.io/demo/TestPages/MobileDemo/AccessPayments/')
        eyes = new Eyes()
        eyes.setBatch(batch)
        await eyes.open(driver, appName, 'TestWebAppScrolling2', {width: 386, height: 512})
        eyes.setStitchMode(StitchMode.CSS)
        await eyes.check('big page on mobile', Target.window().fully())
        await eyes.close()
      } finally {
        await eyes.abortIfNotClosed()
        await driver.quit()
      }
    })

    it('TestWebAppScrolling3', async () => {
      driver = await new Builder()
        .withCapabilities({
          browserName: 'chrome',
          'goog:chromeOptions': {
            mobileEmulation: {
              deviceMetrics: {width: 386, height: 512, pixelRatio: 1},
              userAgent:
                'Mozilla/5.0 (Linux; Android 7.1.1; Nexus 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
            },
            args: ['--window-size=386,512', 'headless'],
          },
        })
        .build()
      try {
        await driver.get('https://www.applitools.com/customers')
        eyes = new Eyes()
        eyes.setBatch(batch)
        await eyes.open(driver, appName, 'TestWebAppScrolling3', {width: 386, height: 512})
        await eyes.check(
          'long page on mobile',
          Target.region(By.css('div.page'))
            .fully(false)
            .sendDom(false),
        )
        await eyes.close()
      } finally {
        await eyes.abortIfNotClosed()
        await driver.quit()
      }
    })
  })

  describe('SauceLabs', () => {
    let eyes, driver
    const sauceCaps = {
      browserName: 'Chrome',
      deviceName: 'Samsung Galaxy S9 WQHD GoogleAPI Emulator',
      platformName: 'Android',
      platformVersion: '8.1',
      deviceOrientation: 'portrait',
      username: process.env.SAUCE_USERNAME,
      accessKey: process.env.SAUCE_ACCESS_KEY,
    }

    beforeEach(async () => {
      driver = await new Builder()
        .withCapabilities(sauceCaps)
        .usingServer(sauceUrl)
        .build()
    })

    afterEach(async () => {
      await eyes.abortIfNotClosed()
      await driver.quit()
    })
    // falls down due to timeout, the page used for testing needs to much screenshots so it takes to much on the sauceLabs
    it.skip('TestWebAppScrolling', async () => {
      await driver.get('https://applitools.github.io/demo/TestPages/MobileDemo/adaptive.html')
      eyes = new Eyes()
      eyes.setBatch(batch)
      let eyesDriver = await eyes.open(driver, appName, `TestWebAppScrolling`, {
        width: 360,
        height: 740,
      })
      let element = await driver.findElement(By.css('.content'))
      let eyesElement = new EyesWebElement(eyes._logger, eyesDriver, element)
      let size = await eyesElement.getScrollSize()
      for (let currentPosition = 0; currentPosition < size.getHeight(); currentPosition += 6000) {
        let height = Math.min(6000, size.getHeight() - currentPosition)
        await eyes.check(
          'TestWebAppScrolling',
          Target.region(new Region(0, currentPosition, size.getWidth(), height))
            .fully()
            .scrollRootElement(element),
        )
      }
      await eyes.close()
    })

    it.skip('TestWebAppScrolling2', async () => {
      await driver.get('https://applitools.github.io/demo/TestPages/MobileDemo/AccessPayments/')
      eyes = new Eyes()
      eyes.setBatch(batch)
      await eyes.open(driver, appName, 'TestWebAppScrolling2', {width: 386, height: 512})
      eyes.setStitchMode(StitchMode.CSS)
      await eyes.check('big page on mobile', Target.window().fully())
      await eyes.close()
    })

    it('TestWebAppScrolling3', async () => {
      await driver.get('https://www.applitools.com/customers')
      eyes = new Eyes()
      eyes.setBatch(batch)
      await eyes.open(driver, appName, 'TestWebAppScrolling3', {width: 386, height: 512})
      await eyes.check(
        'long page on mobile',
        Target.region(By.css('div.page'))
          .fully(false)
          .sendDom(false),
      )
      await eyes.close()
    })
  })
})
