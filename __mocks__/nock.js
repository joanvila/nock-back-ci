/* eslint-disableno-useless-constructor */
/* eslint-disableno-empty-function */


const nockBack = {
  fixtures: null,
  setMode: jest.fn(),
};


module.exports = {
  back: nockBack,
  restore: jest.fn(),
};
