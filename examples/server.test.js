const path = require('path');
const NockBackCI = require('../index');
const appProvider = require('./server');

jest.unmock('nock');

const nockBackCiConfig = {
  localEnvironment: true, // This would depend on the environment
  fixtureName: 'exampleFixture.json',
  fixtureDir: path.join(__dirname, 'fixtures'),
  whitelistedHosts: /(localhost|127\.0\.0\.1|amazonaws)/,
};

let server = null;
let testCase = null;
let nockBackCI = null;

describe('acceptance test', () => {
  beforeAll(async () => {
    nockBackCI = new NockBackCI(nockBackCiConfig);
    server = await nockBackCI.bootServer(appProvider);
  });

  beforeEach(async () => {
    testCase = await nockBackCI.testCaseInit();
  });

  afterEach(() => {
    nockBackCI.testCaseEnd(testCase);
  });

  afterAll((done) => {
    nockBackCI.killServer(server, done);
  });

  it('validates the contract for at least one hotel', async () => {
    const response = await server.get('/endpoint');
    expect(response.body.title).toEqual('London');
    expect(response.status).toBe(200);
  });
});
