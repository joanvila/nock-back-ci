const nock = require('nock');
const fs = require('fs');
const NockBackCI = require('../index');

let existsSyncMock = null;
let unlinkSyncMock = null;

describe('NockBackCI', () => {
  beforeEach(() => {
    existsSyncMock = jest.spyOn(fs, 'existsSync');
    unlinkSyncMock = jest.spyOn(fs, 'unlinkSync');

    existsSyncMock.mockImplementation(() => true);
    unlinkSyncMock.mockImplementation(() => true);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
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
      expect(unlinkSyncMock).toBeCalledWith('fixtureDir/myFixture.json');
      expect(unlinkSyncMock).toBeCalledWith('fixtureDir/boot.json');
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

  describe('bootServer - without nock.back()', () => {
    const userConfig = {
      fixtureName: 'myFixture.json',
      fixtureDir: 'fixtureDir',
    };

    it('sets the nock back mode to record', () => {
      const appProviderMock = jest.fn();
      const setModeMock = jest.spyOn(nock.back, 'setMode');
      const nockBackCi = new NockBackCI(userConfig);

      nockBackCi.bootServer(appProviderMock);

      expect(setModeMock).toHaveBeenCalledWith('record');
    });

    // TODO: Test that we set the mode to wild at the end
  });

  describe('testCaseInit - without nock.back()', () => {
    const userConfig = {
      fixtureName: 'myFixture.json',
      fixtureDir: 'fixtureDir',
      whitelistedHosts: 'localhost',
    };

    it('sets the nock back mode to record', () => {
      const setModeMock = jest.spyOn(nock.back, 'setMode');
      const nockBackCi = new NockBackCI(userConfig);

      nockBackCi.testCaseInit();

      expect(setModeMock).toHaveBeenCalledWith('record');
    });

    it.skip('starts recording fixtures', () => {
      // FIXME: it's not possible to mock the same file more then once, with different responses
      // Either require nock after or let's test testCaseInit and bootServer in a different testfile
      jest.doMock('nock', () => ({
        back: jest.fn(),
      }));

      const nockBackCi = new NockBackCI(userConfig);

      nockBackCi.testCaseInit();

      expect(nock.back).toHaveBeenCalledWith(
        userConfig.fixtureName,
        expect.any(Object),
      );
    });

    // TODO: Test the rest of stuff
  });

  describe('testCaseEnd', () => {
    const userConfig = {
      fixtureName: 'myFixture.json',
      fixtureDir: 'fixtureDir',
    };

    it('stops recording fixtures when called', () => {
      const nockDoneMock = jest.fn();
      const nockBackCi = new NockBackCI(userConfig);

      nockBackCi.testCaseEnd(nockDoneMock);

      expect(nockDoneMock).toHaveBeenCalled();
    });

    it('sets the nock back mode to wild', () => {
      const setModeMock = jest.spyOn(nock.back, 'setMode');
      const nockBackCi = new NockBackCI(userConfig);

      nockBackCi.testCaseEnd(jest.fn());

      expect(setModeMock).toHaveBeenCalledWith('wild');
    });
  });

  describe('killServer', () => {
    const mockCloseApp = jest.fn();

    const userConfig = {
      fixtureName: 'myFixture.json',
      fixtureDir: 'fixtureDir',
    };

    const mockServer = {
      app: { close: mockCloseApp },
    };

    it('sets the nock back mode to wild', () => {
      const setModeMock = jest.spyOn(nock.back, 'setMode');
      const nockBackCi = new NockBackCI(userConfig);

      nockBackCi.killServer(mockServer, jest.fn());

      expect(setModeMock).toHaveBeenCalledWith('wild');
    });

    it('closes the app', () => {
      const doneMock = jest.fn();
      const nockBackCi = new NockBackCI(userConfig);

      nockBackCi.killServer(mockServer, doneMock);

      expect(mockCloseApp).toHaveBeenCalledWith(doneMock);
    });

    it('restores nock setings', () => {
      const restoreMock = jest.spyOn(nock, 'restore');
      const nockBackCi = new NockBackCI(userConfig);

      nockBackCi.killServer(mockServer, jest.fn());

      expect(restoreMock).toHaveBeenCalled();
    });
  });
});
