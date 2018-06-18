const serverless = require('serverless-http');
const express = require('express');
const data = require('./data.js');
const app = express();

app.get('/', (request, response) => {
  console.log(`GET: ${request.originalUrl}`);
  response.send('Cybertip Downloader Dummy Backend is Running');
});

app.get('/reports', (request, response) => {
  console.log(`GET: ${request.originalUrl}`);
  response.header("Access-Control-Allow-Origin", "*");
  response.json(data.reportIds);
});

app.get('/reports/:reportId', (request, response) => {
  const reportId = request.params.reportId;
  console.log(`GET: ${request.originalUrl}`);
  response.header("Access-Control-Allow-Origin", "*");
  response.json(data.reports[reportId]);
});

app.get('/reports/:reportId/uploadedFiles', (request, response) => {
  const reportId = request.params.reportId;
  console.log(`GET: ${request.originalUrl}`);
  response.header("Access-Control-Allow-Origin", "*");
  response.json(data.uploadedFiles);
});

module.exports.handler = serverless(app);
