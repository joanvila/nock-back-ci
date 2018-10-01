jest.unmock('nock');
const fs = require('fs');
const nock = require('nock');
const NockBackCI = require('../index');

const existsSyncMock = jest.spyOn(fs, 'existsSync');
existsSyncMock.mockImplementation(() => false);

const nockBackMock = jest.spyOn(nock, 'back');

describe('NockBackCI', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('bootServer - with nock.back()', () => {
    // TODO: Test nock.back()
  });

  describe('testCaseInit - with nock.back()', () => {
    const userConfig = {
      fixtureName: 'myFixture.json',
      fixtureDir: 'fixtureDir',
      whitelistedHosts: 'localhost',
    };

    it.skip('starts recording fixtures', () => {
      // FIXME: How to mock nock.back if it's an object
      // that can be called as a function???
      const nockBackCi = new NockBackCI(userConfig);

      nockBackCi.testCaseInit();

      expect(nockBackMock).toHaveBeenCalledWith(
        userConfig.fixtureName,
        expect.any(Object),
      );
    });

    // TODO: Test the rest of stuff
  });
});
