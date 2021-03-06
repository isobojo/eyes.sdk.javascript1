'use strict'

const {ArgumentGuard, Location, RectangleSize, EyesError} = require('@applitools/eyes-common')
const {PositionProvider} = require('@applitools/eyes-sdk-core')

const {ScrollPositionMemento} = require('./ScrollPositionMemento')

class ScrollPositionProvider extends PositionProvider {
  /**
   * @param {Logger} logger
   * @param {EyesJsExecutor} executor
   * @param {WebElement} scrollRootElement
   */
  constructor(logger, executor, scrollRootElement) {
    super()

    ArgumentGuard.notNull(logger, 'logger')
    ArgumentGuard.notNull(executor, 'executor')
    ArgumentGuard.notNull(scrollRootElement, 'scrollRootElement')

    this._logger = logger
    this._executor = executor
    this._scrollRootElement = scrollRootElement

    this._logger.verbose('creating ScrollPositionProvider')
  }

  /**
   * @param {EyesJsExecutor} executor
   * @param {WebElement} scrollRootElement
   * @return {Promise<Location>}
   */
  static async getCurrentPositionStatic(executor, scrollRootElement) {
    // Note: Safari Mojave scrollTop is always 0 with overflow hidden
    const script = `
      const el = arguments[0]; 
      if (arguments[0] === document.documentElement) {
        return [el.scrollLeft || pageXOffset, el.scrollTop || pageYOffset] 
      }
      return [el.scrollLeft, el.scrollTop];
    `

    const result = await executor.executeScript(script, scrollRootElement)
    return new Location(Math.ceil(result[0]) || 0, Math.ceil(result[1]) || 0)
  }

  /**
   * @inheritDoc
   */
  async getCurrentPosition() {
    return ScrollPositionProvider.getCurrentPositionStatic(this._executor, this._scrollRootElement)
  }

  /**
   * @inheritDoc
   */
  async setPosition(location) {
    try {
      this._logger.verbose(`setting position of ${this._scrollRootElement} to ${location}`)
      const script = `
         if (arguments[0] === document.documentElement && window.scrollTo) {
           window.scrollTo(${location.getX()}, ${location.getY()});
         } else {
           arguments[0].scrollLeft=${location.getX()}; arguments[0].scrollTop=${location.getY()};
         }
         return [arguments[0].scrollLeft, arguments[0].scrollTop];
      `

      const result = await this._executor.executeScript(script, this._scrollRootElement)
      return new Location(Math.ceil(result[0]) || 0, Math.ceil(result[1]) || 0)
    } catch (err) {
      throw new EyesError('Could not get scroll position!', err)
    }
  }

  /**
   * @inheritDoc
   */
  async getEntireSize() {
    this._logger.verbose('enter')

    const script =
      'var el = arguments[0]; var width = Math.max(el.clientWidth, el.scrollWidth);' +
      'var height = Math.max(el.clientHeight, el.scrollHeight);' +
      'return [width, height];'

    const entireSizeStr = await this._executor.executeScript(script, this._scrollRootElement)
    const result = new RectangleSize(
      Math.ceil(entireSizeStr[0]) || 0,
      Math.ceil(entireSizeStr[1]) || 0,
    )
    this._logger.verbose(`ScrollPositionProvider - Entire size: ${result}`)
    return result
  }

  /**
   * @inheritDoc
   * @return {Promise<ScrollPositionMemento>}
   */
  async getState() {
    const position = await this.getCurrentPosition()
    return new ScrollPositionMemento(position)
  }

  /**
   * @inheritDoc
   * @param {ScrollPositionMemento} state - The initial state of position
   * @return {Promise}
   */
  async restoreState(state) {
    const newPosition = new Location(state.getX(), state.getY())
    await this.setPosition(newPosition)
  }

  /**
   * @override
   * @return {WebElement}
   */
  getScrolledElement() {
    return this._scrollRootElement
  }
}

exports.ScrollPositionProvider = ScrollPositionProvider
