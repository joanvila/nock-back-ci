const path = require('path');
const nockBackCI = require('../index');
const appProvider = require('./server');


const regenenerateFixtures = true; // This would depend on the environment

const FIXTURE_NAME = 'exampleFixture.json';
const FIXTURE_DIR = path.join(__dirname, 'fixtures');

let server = null;
let testAct = null;

describe('acceptance test', () => {
  beforeAll(async () => {
    nockBackCI.setupEnvironment(regenenerateFixtures, FIXTURE_DIR, FIXTURE_NAME);
    server = await nockBackCI.bootServer(appProvider);
  });

  beforeEach(async () => {
    testAct = await nockBackCI.testActStart(FIXTURE_NAME);
  });

  afterEach(() => {
    nockBackCI.testActStop(testAct);
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
