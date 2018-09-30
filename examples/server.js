const https = require('https');
const express = require('express'); // eslint-disable-line import/no-extraneous-dependencies

module.exports = async () => {
  const app = express();

  app.get('/endpoint', (req, res) => {
    https.get('https://www.metaweather.com/api/location/search/?query=london', (resp) => {
      let data = '';
      resp.on('data', (chunk) => { data += chunk; });
      resp.on('end', () => {
        res.json(JSON.parse(data)[0]);
      });
    });
  });

  app.get('/operations/healthcheck', (req, res) => {
    res.json('OK');
  });

  return app;
};
