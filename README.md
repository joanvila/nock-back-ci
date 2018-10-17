# nock-back-ci

[![Build Status](https://travis-ci.org/joanvila/nock-back-ci.svg?branch=master)](https://travis-ci.org/joanvila/nock-back-ci)
[![Coverage Status](https://coveralls.io/repos/github/joanvila/nock-back-ci/badge.svg?branch=master)](https://coveralls.io/github/joanvila/nock-back-ci?branch=master)

A simple acceptance testing helper optimised for complex CI problems

## Motivation

As responsible developers we want to test our NodeJS services with acceptance tests to simulate real traffic.
In a continuous deployment environment, the CI pipeline should be able to run those acceptance tests reliably.

The deployment of our service shouldn’t depend on an external service being up and running.
Moreover, to run our service, we may need to access other services that are not reachable from the CI pipeline.

## Solution

When the acceptance tests are run locally, they will query the real external services. During this run,
the responses of all the external http calls will be stored in a fixture file.

When the tests are run in the CI pipeline, instead of querying the external services,
we will use the mocked responses stored in the fixture file.

This process will be transparent for the developers maintaining the tests.

## Usage

For a complete working example check `examples/server.test.js`.

```javascript
const NockBackCI = require('nock-back-ci');
// appProvider is an awaitable function that returns your express app
const appProvider = require('./yourapp');

// The localEnvironment flag should be set to true when the environment is local
// and false in the CI environment. This is usually done via environment variables.
const nockBackCiConfig = {
  localEnvironment: true,
  fixtureName: 'exampleFixture.json',
  fixtureDir: path.join(__dirname, 'fixtures'),
};

const nockBackCI = new NockBackCI(nockBackCiConfig);
const server = await nockBackCI.bootServer(appProvider); // server is an instance of supertest request

const testCase = await nockBackCI.testCaseInit();

// Test your api here

nockBackCI.testCaseEnd(testCase);
nockBackCI.killServer(server, done);
```

**Tip**: For the best experience place the usage of `nock-back-ci` in the `before/after` jest functions.
Check the `examples/server.test.js` example for inspiration.

## Extra options

Optional features.

```javascript
const nockBackCiConfig = {
  localEnvironment: true,
  fixtureName: 'exampleFixture.json',
  fixtureDir: path.join(__dirname, 'fixtures'),
  whitelistedHosts: /(localhost|127\.0\.0\.1|kms.amazonaws)/,
  healthcheck: '/operations/healthcheck', // The test won't start until this endpoint replies a 200
};
```

### Security

Keep in mind that nock-back-ci will record ALL http calls made by your service by default.

Please take care if your application sends or receives sensitive information like credentials, access keys, or users' personal information so that these data are not committed to your repository inside the fixutes.

To skip nocking for a particular endpoint, add it with the `whitelistedHosts` option to the `nock-back-ci` config like the example above.

### API Warmup

In some cases, starting the api and having it ready to serve traffic may take a while.
This is usually the case when it queries external services and warms up caches.

If this is your case, by providing an optional `healthcheck` parameter the test won't start until the healthcheck of the api becomes green.

Moreover when using this functionality, a separate fixture named `boot.json` will be created to store
the http responses of the services queried at startup time.

## Todo

Items on the roadmap.

- Add tests to the lib/options file
- Feature: When to recreate local fixtures policy
- Feature: Config validation

## Contributing

See the `CONTRIBUTING.md` file.

## License

MIT License (c) 2018 Joan Vilà Cuñat
