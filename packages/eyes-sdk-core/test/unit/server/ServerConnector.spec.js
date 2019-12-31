'use strict'

const assert = require('assert')
const {ServerConnector, Logger, Configuration} = require('../../../')
const {presult} = require('../../../lib/troubleshoot/utils')
const logger = new Logger(process.env.APPLITOOLS_SHOW_LOGS)
const fakeEyesServer = require('@applitools/sdk-fake-eyes-server')

describe('ServerConnector', () => {
  it('_createHttpOptions works', () => {
    const configuratiion = new Configuration()
    const connector = new ServerConnector(logger, configuratiion)
    const options = connector._createHttpOptions({
      method: 'POST',
      url: 'https://some.url/some/api',
      data: {},
    })

    delete options.params.apiKey
    assert.deepStrictEqual(options, {
      proxy: undefined,
      headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
      timeout: 300000,
      responseType: 'json',
      params: {},
      method: 'POST',
      url: 'https://some.url/some/api',
      data: {},
      maxContentLength: 20971520,
    })
  })

  it('sends startSession request', async () => {
    const {port, close} = await fakeEyesServer({logger})
    try {
      const serverUrl = `http://localhost:${port}`
      const configuration = new Configuration()
      configuration.setServerUrl(serverUrl)
      const serverConnector = new ServerConnector(logger, configuration)
      const appIdOrName = 'ServerConnector unit test'
      const scenarioIdOrName = "doesn't throw exception on server failure"
      const batchId = String(Date.now())
      const runningSession = await serverConnector.startSession({
        appIdOrName,
        scenarioIdOrName,
        environment: {},
        batchInfo: {
          id: batchId,
        },
      })
      const sessionId = `${appIdOrName}__${scenarioIdOrName}`
      assert.deepStrictEqual(runningSession.toJSON(), {
        baselineId: `${sessionId}__baseline`,
        batchId,
        id: `${sessionId}__running`,
        isNewSession: false,
        renderingInfo: undefined,
        sessionId,
        url: `${sessionId}__url`,
      })
    } finally {
      await close()
    }
  })

  // [trello] https://trello.com/c/qjmAw1Sc/160-storybook-receiving-an-inconsistent-typeerror
  it("doesn't throw exception on server failure", async () => {
    const {port, close} = await fakeEyesServer({logger, hangUp: true})
    try {
      const serverUrl = `http://localhost:${port}`
      const configuration = new Configuration()
      configuration.setServerUrl(serverUrl)
      const serverConnector = new ServerConnector(logger, configuration)
      const [err] = await presult(serverConnector.startSession({}))
      assert.deepStrictEqual(err, new Error('socket hang up'))
    } finally {
      await close()
    }
  })
})