const nock = require('nock');
const fs = require('fs');
const NockBackCI = require('../index');

const existsSyncMock = jest.spyOn(fs, 'existsSync');
const unlinkSyncMock = jest.spyOn(fs, 'unlinkSync');

existsSyncMock.mockImplementation(() => true);
unlinkSyncMock.mockImplementation(() => true);

describe('NockBackCI', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const defaultConfig = {
    localEnvironment: true,
    fixtureName: 'fixture.json',
    fixtureDir: null,
    whitelistedHosts: /(localhost|127\.0\.0\.1)/,
  };

  describe('constructor', () => {
    it('merges the default config with the user config', () => {
      const userConfig = {
        fixtureName: 'myFixture.json',
        fixtureDir: 'fixtureDir',
      };

      const nockBackCi = new NockBackCI(userConfig);

      expect(nockBackCi.config).toEqual({
        localEnvironment: defaultConfig.localEnvironment,
        fixtureName: 'myFixture.json',
        fixtureDir: 'fixtureDir',
        whitelistedHosts: defaultConfig.whitelistedHosts,
      });
    });

    it('sets nock back fixture directory', () => {
      const userConfig = {
        fixtureDir: 'fixtureDir',
      };

      new NockBackCI(userConfig); // eslint-disable-line no-new

      expect(nock.back.fixtures).toEqual('fixtureDir');
    });

    it('does not check if the file exists if we are not in development', () => {
      const userConfig = {
        localEnvironment: false,
      };

      new NockBackCI(userConfig); // eslint-disable-line no-new

      expect(existsSyncMock).not.toBeCalled();
    });

    it('removes the fixtures in local environment', () => {
      const userConfig = {
        localEnvironment: true,
        fixtureName: 'myFixture.json',
        fixtureDir: 'fixtureDir',
      };

      new NockBackCI(userConfig); // eslint-disable-line no-new

      expect(existsSyncMock).toBeCalledWith('fixtureDir/myFixture.json');
      expect(existsSyncMock).toBeCalledWith('fixtureDir/boot.json');
      // TODO: Uncomenting the next two lines should make the test pass
      // expect(unlinkSyncMock).toBeCalledWith('fixtureDir/myFixture.json');
      // expect(unlinkSyncMock).toBeCalledWith('fixtureDir/boot.json');
    });

    it('doesnt remove the fixtures if they do not exists', () => {
      existsSyncMock.mockImplementation(() => false);
      const userConfig = {
        localEnvironment: true,
        fixtureName: 'myFixture.json',
        fixtureDir: 'fixtureDir',
      };

      new NockBackCI(userConfig); // eslint-disable-line no-new

      expect(existsSyncMock).toBeCalledWith('fixtureDir/myFixture.json');
      expect(existsSyncMock).toBeCalledWith('fixtureDir/boot.json');
      expect(unlinkSyncMock).not.toBeCalled();
      expect(unlinkSyncMock).not.toBeCalled();
    });
  });
});
