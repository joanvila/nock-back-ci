/* eslint-disable no-param-reassign */
const request = require('supertest');
const nock = require('nock');
const path = require('path');
const zlib = require('zlib');
const fs = require('fs');

const WHITELISTED_HOSTS = /(localhost|127\.0\.0\.1|amazonaws)/;


const makeCompressedResponsesReadable = (scope) => {
  if (scope.rawHeaders.indexOf('gzip') > -1) {
    const fullResponseBody = scope.response
      && scope.response.reduce
      && scope.response.reduce((previous, current) => previous + current);
    try {
      scope.response = JSON.parse(zlib.gunzipSync(Buffer.from(fullResponseBody, 'hex')).toString('utf8'));
    } catch (e) {
      scope.response = '';
    }
  }
  delete scope.rawHeaders;
  return scope;
};

const compareByUrl = (scopeA, scopeB) => {
  const fullUrlA = `${scopeA.scope}${scopeA.path}`;
  const fullUrlB = `${scopeB.scope}${scopeB.path}`;

  if (fullUrlA > fullUrlB) {
    return 1;
  }
  if (fullUrlA < fullUrlB) {
    return -1;
  }
  return 0;
};

const removeDuplicates = (outputs) => {
  const obj = {};
  return Object.keys(outputs.reduce((prev, next) => {
    if (!obj[next.path]) obj[next.path] = next;
    return obj;
  }, obj)).map(i => obj[i]);
};

const is200 = scope => scope.status === 200;

const defaultOptions = {
  afterRecord: (outputs) => {
    const reducedOutput = removeDuplicates(outputs);
    return reducedOutput
      .filter(o => !o.scope.match(WHITELISTED_HOSTS))
      .filter(is200)
      .map(makeCompressedResponsesReadable)
      .sort(compareByUrl);
  },
  after: scope => scope.persist(),
};

const setupEnvironment = (regenerateFixtures, fixturesDir, fixtureName) => {
  nock.back.fixtures = fixturesDir;
  // In local use the real mshell-secrets instead of the mocks
  // and remove the fixtures so they get regenerated from the real network calls
  if (regenerateFixtures) {
    const testFixtureFile = path.join(fixturesDir, fixtureName);
    if (fs.existsSync(testFixtureFile)) {
      fs.unlinkSync(testFixtureFile);
    }

    const bootFixtureFile = path.join(fixturesDir, 'boot.json');
    if (fs.existsSync(bootFixtureFile)) {
      fs.unlinkSync(bootFixtureFile);
    }
  }
};

const bootServer = async (appProvider) => {
  let healthChecked = false;

  nock.back.setMode('record');
  const { nockDone } = await nock.back('boot.json', defaultOptions);
  nock.enableNetConnect(WHITELISTED_HOSTS);

  const app = await appProvider();
  const server = request.agent(app);

  while (!healthChecked) {
    const response = await server.get('/operations/healthcheck'); // eslint-disable-line no-await-in-loop
    if (response && response.statusCode === 200) {
      healthChecked = true;
    }
  }

  nockDone();
  nock.back.setMode('wild');
  return server;
};

const testActStart = async (fixtureName) => {
  nock.back.setMode('record');
  const { nockDone } = await nock.back(fixtureName, defaultOptions);
  nock.enableNetConnect(WHITELISTED_HOSTS);
  return nockDone;
};

const testActStop = (nockDone) => {
  nockDone();
  nock.back.setMode('wild');
};

const killServer = async (server, done) => {
  nock.back.setMode('wild');
  server.app.close(done);
  nock.restore();
};

module.exports = {
  setupEnvironment,
  bootServer,
  testActStart,
  testActStop,
  killServer,
};
