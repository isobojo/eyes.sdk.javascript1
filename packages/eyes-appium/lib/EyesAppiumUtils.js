'use strict'

const {EyesSeleniumUtils} = require('@applitools/eyes-selenium')

/**
 * @ignore
 */
class EyesAppiumUtils extends EyesSeleniumUtils {
  /**
   * @param {IWebDriver} driver - The driver to test.
   * @return {Promise<boolean>} {@code true} if the driver is an Android driver. {@code false} otherwise.
   */
  static async isAndroid(driver) {
    const capabilities = await driver.getCapabilities()
    return EyesAppiumUtils.isAndroidFromCaps(capabilities)
  }

  /**
   * @param {Capabilities} capabilities - The driver's capabilities.
   * @return {boolean} {@code true} if the driver is an Android driver. {@code false} otherwise.
   */
  static isAndroidFromCaps(capabilities) {
    return capabilities.get('platformName').toUpperCase() === 'ANDROID'
  }

  /**
   * @param {IWebDriver} driver - The driver to test.
   * @return {Promise<boolean>} {@code true} if the driver is an Android driver. {@code false} otherwise.
   */
  static async isIOS(driver) {
    const capabilities = await driver.getCapabilities()
    return EyesAppiumUtils.isIOSFromCaps(capabilities)
  }

  /**
   * @param {Capabilities} capabilities - The driver's capabilities.
   * @return {boolean} {@code true} if the driver is an Android driver. {@code false} otherwise.
   */
  static isIOSFromCaps(capabilities) {
    return capabilities.get('platformName').toUpperCase() === 'IOS'
  }

  /**
   * @param {IWebDriver} driver - The driver to get the platform version from.
   * @return {Promise<string>} - The platform version or {@code null} if it is undefined.
   */
  static async getPlatformVersion(driver) {
    const capabilities = await driver.getCapabilities()
    return EyesAppiumUtils.getPlatformVersionFromCaps(capabilities)
  }

  /**
   * @param {Capabilities} capabilities - The driver's capabilities.
   * @return {string} - The platform version or {@code null} if it is undefined.
   */
  static getPlatformVersionFromCaps(capabilities) {
    return capabilities.get('platformVersion')
  }
}

exports.EyesAppiumUtils = EyesAppiumUtils
