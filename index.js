/* eslint-disable class-methods-use-this */
const request = require('supertest');
const nock = require('nock');
const path = require('path');

const fs = require('fs');
const getDefaultOptions = require('./lib/options');

const defaultConfig = {
  localEnvironment: true,
  fixtureName: 'fixture.json',
  fixtureDir: null,
  whitelistedHosts: /(localhost|127\.0\.0\.1)/,
  healthcheck: null,
};


class NockBackCI {
  constructor(userConfig) {
    this.config = { ...defaultConfig, ...userConfig };
    this.defaultOptions = getDefaultOptions(this.config.whitelistedHosts);

    nock.back.fixtures = this.config.fixtureDir;

    if (this.config.localEnvironment) {
      const testFixtureFile = path.join(this.config.fixtureDir, this.config.fixtureName);
      if (fs.existsSync(testFixtureFile)) {
        fs.unlinkSync(testFixtureFile);
      }

      const bootFixtureFile = path.join(this.config.fixtureDir, 'boot.json');
      if (fs.existsSync(bootFixtureFile)) {
        fs.unlinkSync(bootFixtureFile);
      }
    }
  }

  async bootServer(appProvider) {
    let healthChecked = false;

    nock.back.setMode('record');
    const { nockDone } = await nock.back('boot.json', this.defaultOptions);
    nock.enableNetConnect(this.config.whitelistedHosts);

    const app = await appProvider();
    const server = request.agent(app);

    while (this.config.healthcheck && !healthChecked) {
      // eslint-disable-next-line no-await-in-loop
      const response = await server.get(this.config.healthcheck);
      if (response && response.statusCode === 200) {
        healthChecked = true;
      }
    }

    nockDone();
    nock.back.setMode('wild');
    return server;
  }

  async testCaseInit() {
    nock.back.setMode('record');
    const { nockDone } = await nock.back(this.config.fixtureName, this.defaultOptions);
    nock.enableNetConnect(this.config.whitelistedHosts);
    return nockDone;
  }

  testCaseEnd(nockDone) {
    nockDone();
    nock.back.setMode('wild');
  }

  killServer(server, done) {
    nock.back.setMode('wild');
    server.app.close(done);
    nock.restore();
  }
}

module.exports = NockBackCI;
