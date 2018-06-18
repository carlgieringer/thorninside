const serverless = require('serverless-http');
const express = require('express');
const app = express();

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const dynamoDb = new AWS.DynamoDB.DocumentClient();

app.get('/', (request, response) => {
  console.log(`GET: ${request.originalUrl}`);
  response.send('Thorn Cybertip Report Scorer is Running');
});

app.get('/reports', (request, response) => {
  response.json(scanReports());
});

app.get('/reports/:reportId', (request, response) => {
  const reportId = request.params.reportId;
  response.json(getReport(reportId));
});

const scanReports = () => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
  };
  return dynamoDb.scan(params, (error) => {
    if (error) throw error
    return data['Items']
  });
}

const getReport = (reportId) => {
  const params = {
    Key: {
      "reportId": {
        N: +reportId
      }
    },
    TableName: process.env.DYNAMODB_TABLE,
  };
  return dynamoDb.getItem(params, (error) => {
    if (error) throw error
    return data['Item']
  });
}

module.exports.handler = serverless(app);
