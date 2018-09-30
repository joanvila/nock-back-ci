/* eslint-disable no-param-reassign */
const zlib = require('zlib');

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

module.exports = whitelistedHosts => ({
  afterRecord: (outputs) => {
    const reducedOutput = removeDuplicates(outputs);
    return reducedOutput
      .filter(o => !o.scope.match(whitelistedHosts))
      .filter(is200)
      .map(makeCompressedResponsesReadable)
      .sort(compareByUrl);
  },
  after: scope => scope.persist(),
});
