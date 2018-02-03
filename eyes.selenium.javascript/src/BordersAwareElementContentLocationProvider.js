'use strict';

const {ArgumentGuard, Location} = require('eyes.sdk.core');

const EyesWebElement = require('./wrappers/EyesWebElement');

/**
 * Encapsulates an algorithm to find an element's content location, based on the element's location.
 */
class BordersAwareElementContentLocationProvider {

    /**
     * Returns a location based on the given location.
     *
     * @param {Logger} logger The logger to use.
     * @param {EyesWebElement} element The element for which we want to find the content's location.
     * @param {Location} location The location of the element.
     * @return {Promise.<Location>} The location of the content of the element.
     */
    getLocation(logger, element, location) {
        ArgumentGuard.notNull(logger, "logger");
        ArgumentGuard.notNull(element, "element");
        ArgumentGuard.notNull(location, "location");

        logger.verbose(`BordersAdditionFrameLocationProvider(logger, element, ${location})`);

        // Frame borders also have effect on the frame's location.
        return getPropertyValue(logger, element, "border-left-width").then(leftBorderWidth => {
            return getPropertyValue(logger, element, "border-top-width").then(topBorderWidth => {
                const contentLocation = new Location(location).offset(leftBorderWidth, topBorderWidth);
                logger.verbose("Done!");
                return contentLocation;
            });
        });
    };
}

/**
 * @private
 * @param {Logger} logger
 * @param {EyesWebElement} element
 * @param {String} propName
 * @return {Promise.<int>}
 */
function getPropertyValue(logger, element, propName) {
    logger.verbose(`Get element's ${propName}...`);

    let promise;
    if (element instanceof EyesWebElement) {
        logger.verbose("Element is an EyesWebElement, using 'getComputedStyle'.");
        promise = element.getComputedStyle(propName).catch(err => {
            logger.verbose(`Using getComputedStyle failed: ${err}`);
            logger.verbose("Using getCssValue...");
            return element.getCssValue(propName);
        }).then(result => {
            logger.verbose("Done!");
            return result;
        });
    } else {
        // OK, this is weird, we got an element which is not EyesWebElement?? Log it and try to move on.
        logger.verbose(`Element is not an EyesWebElement! (when trying to get ${propName}) Element's class: ${element.constructor.name}`);
        logger.verbose("Using getCssValue...");
        promise = element.getCssValue(propName).then(result => {
            logger.verbose("Done!");
            return result;
        });
    }

    return promise.catch(err => {
        logger.verbose(`Couldn't get the element's ${propName}: ${err}.  Falling back to default`);
        return 0;
    }).then(result => {
        // Convert value from the format "2px" to int.
        const borderWidth = Math.round(Number(result.trim().replace("px", "")));
        logger.verbose(`${propName}: ${borderWidth}`);
        return borderWidth;
    });
}

module.exports = BordersAwareElementContentLocationProvider;
