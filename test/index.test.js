const supertest = require('supertest');
const nock = require('nock');
const fs = require('fs');
const NockBackCI = require('../index');


jest.mock('nock', () => {
  const back = jest.fn();
  const restore = jest.fn();
  const enableNetConnect = jest.fn();
  return {
    back,
    restore,
    enableNetConnect,
  };
});

const mockServerGet = jest.fn();
const mockServer = {
  get: mockServerGet,
};

jest.mock('supertest', () => {
  const agent = jest.fn();
  return {
    agent,
  };
});

let existsSyncMock = null;
let unlinkSyncMock = null;
const nockDoneMock = jest.fn();

describe('NockBackCI', () => {
  beforeEach(() => {
    existsSyncMock = jest.spyOn(fs, 'existsSync');
    unlinkSyncMock = jest.spyOn(fs, 'unlinkSync');

    existsSyncMock.mockImplementation(() => true);
    unlinkSyncMock.mockImplementation(() => true);

    nock.back.mockImplementation(() => Promise.resolve({ nockDone: nockDoneMock }));
    nock.back.setMode = jest.fn();

    mockServerGet.mockImplementation(() => Promise.resolve({ statusCode: 200 }));
    supertest.agent.mockImplementation(() => mockServer);
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

  describe('bootServer', () => {
    const userConfig = {
      fixtureName: 'myFixture.json',
      fixtureDir: 'fixtureDir',
    };

    const appProviderMock = jest.fn();

    beforeEach(() => {
      appProviderMock.mockImplementation(() => Promise.resolve('appMock'));
    });

    it('sets the nock back mode to record', async () => {
      const nockBackCi = new NockBackCI(userConfig);

      await nockBackCi.bootServer(appProviderMock);

      expect(nock.back.setMode).toHaveBeenCalledWith('record');
    });

    it('starts recording fixtures', async () => {
      const nockBackCi = new NockBackCI(userConfig);

      await nockBackCi.bootServer(appProviderMock);

      expect(nock.back).toHaveBeenCalledWith(
        'boot.json',
        expect.any(Object),
      );
    });

    it('enables the connection for the allowed hosts', async () => {
      const userConfigWithWhitelistedHosts = {
        ...userConfig,
        whitelistedHosts: defaultConfig.whitelistedHosts,
      };
      const nockBackCi = new NockBackCI(userConfigWithWhitelistedHosts);

      await nockBackCi.bootServer(appProviderMock);

      expect(nock.enableNetConnect).toHaveBeenCalledWith(
        defaultConfig.whitelistedHosts,
      );
    });

    it('returns the server created with the app provided by appProvider', async () => {
      const nockBackCi = new NockBackCI(userConfig);

      const server = await nockBackCi.bootServer(appProviderMock);

      expect(appProviderMock).toHaveBeenCalledTimes(1);
      expect(supertest.agent).toHaveBeenCalledWith('appMock');
      expect(server).toBe(mockServer);
    });

    it('calls the healthcheck to boot the app', async () => {
      const nockBackCi = new NockBackCI(userConfig);

      await nockBackCi.bootServer(appProviderMock);

      expect(mockServerGet).toHaveBeenCalledWith('/operations/healthcheck');
    });

    it('calls nockDone', async () => {
      const nockBackCi = new NockBackCI(userConfig);

      await nockBackCi.bootServer(appProviderMock);

      expect(nockDoneMock).toHaveBeenCalled();
    });

    it('sets the nock back mode to wild', async () => {
      const nockBackCi = new NockBackCI(userConfig);

      await nockBackCi.bootServer(appProviderMock);

      expect(nock.back.setMode).toHaveBeenCalledWith('wild');
    });
  });

  describe('testCaseInit', async () => {
    const userConfig = {
      fixtureName: 'myFixture.json',
      fixtureDir: 'fixtureDir',
      whitelistedHosts: 'localhost',
    };

    it('sets the nock back mode to record', async () => {
      const nockBackCi = new NockBackCI(userConfig);

      await nockBackCi.testCaseInit();

      expect(nock.back.setMode).toHaveBeenCalledWith('record');
    });

    it('starts recording fixtures', async () => {
      const nockBackCi = new NockBackCI(userConfig);

      await nockBackCi.testCaseInit();

      expect(nock.back).toHaveBeenCalledWith(
        userConfig.fixtureName,
        expect.any(Object),
      );
    });

    it('enables the connection for the allowed hosts', async () => {
      const userConfigWithWhitelistedHosts = {
        ...userConfig,
        whitelistedHosts: defaultConfig.whitelistedHosts,
      };
      const nockBackCi = new NockBackCI(userConfigWithWhitelistedHosts);

      await nockBackCi.testCaseInit();

      expect(nock.enableNetConnect).toHaveBeenCalledWith(
        defaultConfig.whitelistedHosts,
      );
    });

    it('returns the nockDone', async () => {
      const userConfigWithWhitelistedHosts = {
        ...userConfig,
        whitelistedHosts: defaultConfig.whitelistedHosts,
      };
      const nockBackCi = new NockBackCI(userConfigWithWhitelistedHosts);

      const nockDone = await nockBackCi.testCaseInit();

      expect(nockDone).toBe(nockDoneMock);
    });
  });

  describe('testCaseEnd', () => {
    const userConfig = {
      fixtureName: 'myFixture.json',
      fixtureDir: 'fixtureDir',
    };

    it('stops recording fixtures when called', () => {
      const nockDoneParam = jest.fn();
      const nockBackCi = new NockBackCI(userConfig);

      nockBackCi.testCaseEnd(nockDoneParam);

      expect(nockDoneParam).toHaveBeenCalled();
    });

    it('sets the nock back mode to wild', () => {
      const nockBackCi = new NockBackCI(userConfig);

      nockBackCi.testCaseEnd(jest.fn());

      expect(nock.back.setMode).toHaveBeenCalledWith('wild');
    });
  });

  describe('killServer', () => {
    const mockCloseApp = jest.fn();

    const userConfig = {
      fixtureName: 'myFixture.json',
      fixtureDir: 'fixtureDir',
    };

    const mockServerParam = {
      app: { close: mockCloseApp },
    };

    it('sets the nock back mode to wild', () => {
      const nockBackCi = new NockBackCI(userConfig);

      nockBackCi.killServer(mockServerParam, jest.fn());

      expect(nock.back.setMode).toHaveBeenCalledWith('wild');
    });

    it('closes the app', () => {
      const doneMock = jest.fn();
      const nockBackCi = new NockBackCI(userConfig);

      nockBackCi.killServer(mockServerParam, doneMock);

      expect(mockCloseApp).toHaveBeenCalledWith(doneMock);
    });

    it('restores nock setings', () => {
      const nockBackCi = new NockBackCI(userConfig);

      nockBackCi.killServer(mockServerParam, jest.fn());

      expect(nock.restore).toHaveBeenCalled();
    });
  });
});
