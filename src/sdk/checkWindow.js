'use strict';

const saveData = require('../troubleshoot/saveData');
const createRenderRequests = require('./createRenderRequests');
const createCheckSettings = require('./createCheckSettings');

const {presult} = require('@applitools/functional-commons');
const {RectangleSize, Location} = require('@applitools/eyes-sdk-core');
const calculateIgnoreAndFloatingRegions = require('./calculateIgnoreAndFloatingRegions');

function makeCheckWindow({
  getError,
  saveDebugData,
  createRGridDOMAndGetResourceMapping,
  renderBatch,
  waitForRenderedStatus,
  renderInfo,
  logger,
  getCheckWindowPromises,
  setCheckWindowPromises,
  browsers,
  setError,
  wrappers,
  renderThroat,
  stepCounter,
  testName,
  openEyesPromises,
  matchLevel: _matchLevel,
}) {
  return function checkWindow({
    resourceUrls = [],
    resourceContents = {},
    frames = [],
    url,
    cdt,
    tag,
    sizeMode = 'full-page',
    selector,
    region,
    scriptHooks,
    ignore,
    floating,
    sendDom = true,
    matchLevel = _matchLevel,
  }) {
    const currStepCount = ++stepCounter;
    logger.log(`running checkWindow for test ${testName} step #${currStepCount}`);
    if (getError()) {
      logger.log('aborting checkWindow synchronously');
      return;
    }
    const getResourcesPromise = createRGridDOMAndGetResourceMapping({
      resourceUrls,
      resourceContents,
      cdt,
      url,
      frames,
    });
    const renderPromise = presult(startRender());

    let renderJobs; // This will be an array of `resolve` functions to rendering jobs. See `createRenderJob` below.

    setCheckWindowPromises(
      browsers.map((_browser, i) => checkWindowJob(getCheckWindowPromises()[i], i).catch(setError)),
    );

    async function checkWindowJob(prevJobPromise = presult(Promise.resolve()), index) {
      if (getError()) {
        logger.log(
          `aborting checkWindow - not waiting for render to complete (so no renderId yet)`,
        );
        return;
      }

      const [renderErr, renderIds] = await renderPromise;

      if (getError()) {
        logger.log(
          `aborting checkWindow after render request complete but before waiting for rendered status`,
        );
        renderJobs && renderJobs[index]();
        return;
      }

      if (renderErr) {
        setError(renderErr);
        renderJobs && renderJobs[index]();
        return;
      }

      const renderId = renderIds[index];

      logger.log(
        `render request complete for ${renderId}. test=${testName} stepCount #${currStepCount} tag=${tag} sizeMode=${sizeMode} browser: ${JSON.stringify(
          browsers[index],
        )}`,
      );

      const [renderStatusErr, renderStatusResult] = await presult(
        waitForRenderedStatus(renderId, getError),
      );

      if (getError()) {
        logger.log('aborting checkWindow after render status finished');
        renderJobs && renderJobs[index]();
        return;
      }

      if (renderStatusErr) {
        logger.log('aborting checkWindow becuase render status failed');
        setError(renderStatusErr);
        renderJobs && renderJobs[index]();
        return;
      }

      const {
        imageLocation: screenshotUrl,
        domLocation,
        userAgent,
        deviceSize,
        selectorRegions,
      } = renderStatusResult;

      if (screenshotUrl) {
        logger.log(`screenshot available for ${renderId} at ${screenshotUrl}`);
      } else {
        logger.log(`screenshot NOT available for ${renderId}`);
      }

      renderJobs && renderJobs[index]();

      const wrapper = wrappers[index];
      wrapper.setInferredEnvironment(`useragent:${userAgent}`);
      if (deviceSize) {
        wrapper.setViewportSize(new RectangleSize(deviceSize));
      }

      logger.log(`checkWindow waiting for prev job. test=${testName}, stepCount #${currStepCount}`);

      await prevJobPromise;

      if (getError()) {
        logger.log(
          `aborting checkWindow for ${renderId} because there was an error in some previous job`,
        );
        return;
      }

      const imageLocationRegion = sizeMode === 'selector' ? selectorRegions[0] : undefined;
      const imageLocation = imageLocationRegion
        ? new Location({x: imageLocationRegion.getLeft(), y: imageLocationRegion.getTop()})
        : undefined;

      const {ignoreRegions, floatingRegions} = calculateIgnoreAndFloatingRegions({
        ignore,
        floating,
        selectorRegions,
        imageLocationRegion,
      });

      const checkSettings = createCheckSettings({ignore: ignoreRegions, floating: floatingRegions});

      logger.log(`checkWindow waiting for openEyes. test=${testName}, stepCount #${currStepCount}`);

      await openEyesPromises[index];

      if (getError()) {
        logger.log(`aborting checkWindow after waiting for openEyes promise`);
        return;
      }

      logger.log(`running wrapper.checkWindow for test ${testName} stepCount #${currStepCount}`);

      const origMatchLevel = wrapper.getMatchLevel();
      if (matchLevel !== undefined) wrapper.setMatchLevel(matchLevel);

      await wrapper.checkWindow({
        screenshotUrl,
        tag,
        domUrl: domLocation,
        checkSettings,
        imageLocation,
      });

      wrapper.setMatchLevel(origMatchLevel); // origMatchLevel cannot be undefined because eyes-sdk-core sets the default to MatchLevel.Strict
    }

    async function startRender() {
      if (getError()) {
        logger.log(`aborting startRender because there was an error in getRenderInfo`);
        return;
      }

      const {rGridDom: dom, allResources: resources} = await getResourcesPromise;

      if (getError()) {
        logger.log(`aborting startRender because there was an error in getAllResources`);
        return;
      }

      const renderRequests = createRenderRequests({
        url,
        dom,
        resources: Object.values(resources),
        browsers,
        renderInfo,
        sizeMode,
        selector,
        region,
        scriptHooks,
        ignore,
        floating,
        sendDom,
      });

      let renderIds = await renderThroat(() => renderBatch(renderRequests));
      renderJobs = renderIds.map(createRenderJob);

      if (saveDebugData) {
        for (const renderId of renderIds) {
          await saveData({renderId, cdt, resources, url, logger});
        }
      }

      return renderIds;
    }
  };

  /**
   * Run a function down the renderThroat and return a way to resolve it. Once resolved (in another place) it makes room in the throat for the next renders that
   */
  function createRenderJob() {
    let resolve;
    const p = new Promise(res => (resolve = res));
    renderThroat(() => p);
    return resolve;
  }
}

module.exports = makeCheckWindow;