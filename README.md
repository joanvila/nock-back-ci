# nock-back-ci

A simple acceptance testing helper optimised for complex CI problems

## Motivation

As responsible developers we want to test our NodeJS service with acceptance tests to simulate real traffic.

In a continuous deployment environment, the CI pipeline should be able to run those acceptance tests,
however, the deployment of our service shouldn’t depend on an external service being up and running.

Moreover, to run our service, we may need to access ohter services that are not reachable from the CI pipeline.
An example of this can be a secrets provider service.

## Solution

When the acceptance tests are run in local, they will query the real external services. During this run,
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
// and false in the CI environment
const nockBackCiConfig = {
  localEnvironment: true,
  fixtureName: 'exampleFixture.json',
  fixtureDir: path.join(__dirname, 'fixtures'),
};

const nockBackCI = new NockBackCI(nockBackCiConfig);
const server = await nockBackCI.bootServer(appProvider); // server is an instance of supertest request

const testCase = await nockBackCI.testCaseInit();

// Test your api now

nockBackCI.testCaseEnd(testCase);
nockBackCI.killServer(server, done);
```

**Tip**: For the best experience place the usage of `nock-back-ci` in the `before/after` jest functions.
Check the `examples/server.test.js` example for inspiration.

## Todo

Items on the roadmap.

- Set up travis ci
- Add tests to the package
- Add coverage report
- Feature: Optional boot checking for healthcheck and configurable healthcheck endpoint
- Feature: When to recreate local fixtures policy
- Feature: Config validation

## Contributing

See the `CONTRIBUTING.md` file.

## License

MIT License (c) 2018 Joan Vilà Cuñat