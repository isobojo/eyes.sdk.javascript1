const {describe, it, after} = require('mocha');
const {exec} = require('child_process');
const {resolve} = require('path');
const {promisify: p} = require('util');

require('dotenv').config(); // TODO can this be removed because the plugin already does this?
const rootPath = resolve(__dirname, '../..');
const rootPackageJson = require(resolve(rootPath, 'package.json'));
const testAppPath = resolve(__dirname, '../fixtures/testApp');
const pexec = p(exec);

describe('package and install', () => {
  let packageFilePath;
  after(async () => {
    process.chdir(testAppPath);
    await pexec(
      `rm -rf node_modules cypress/videos cypress/screenshots cypress/fixtures ${packageFilePath} package-lock.json`,
    );
  });

  it('installs and runs properly', async () => {
    const {name, version} = rootPackageJson;
    const packageName = name
      .split('/')
      .map(x => x.replace('@', ''))
      .join('-');
    packageFilePath = resolve(rootPath, `${packageName}-${version}.tgz`);
    await pexec(`npm pack ${rootPath}`);
    process.chdir(testAppPath);
    await pexec(`npm install ${resolve(rootPath, 'node_modules/cypress')}`);
    await pexec(`npm install ${packageFilePath}`);

    // TODO remove this when PR is merged
    await pexec(
      `cp ${resolve(
        rootPath,
        'node_modules/@applitools/eyes.sdk.core/lib/server/ServerConnector.js',
      )} ${resolve(
        testAppPath,
        'node_modules/@applitools/eyes.sdk.core/lib/server/ServerConnector.js',
      )}`,
    );

    try {
      await pexec(
        './node_modules/.bin/cypress run --config integrationFolder=cypress/integration-pack,pluginsFile=cypress/plugins/index-pack.js,supportFile=cypress/support/index-pack.js',
        {maxBuffer: 10000000},
      );
    } catch (ex) {
      console.error('Error!', ex.stdout);
      throw ex;
    }
  });
});
