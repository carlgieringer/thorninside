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
  scanReports(reports => response.json(reports))
});

app.get('/reports/:reportId', (request, response) => {
  const reportId = request.params.reportId;
  getReport(reportId, report => response.json(report))
});

app.post('/reports/:reportId', (request, response) => {
  const reportId = request.params.reportId;
  const newLabel = request.body['newLabel']
  updateReportLabel(reportId, report => response.json(report))
});

const scanReports = (callback) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
  };
  return dynamoDb.scan(params, (error, data) => {
    if (error) throw error
    callback(data['Items'])
  });
}

const getReport = (reportId, callback) => {
  const params = {
    Key: {
      "reportId": {
        N: +reportId
      }
    },
    TableName: process.env.DYNAMODB_TABLE,
  };
  return dynamoDb.getItem(params, (error, data) => {
    if (error) throw error
    callback(data['Item'])
  });
}

const updateReportLabel = (reportId, newLabel, callback) => {
  const params = {
    Item: {
      "reportId": {
        N: +reportId
      },
      "Label": {
        S: newLabel
      }
    },
    TableName: process.env.DYNAMODB_TABLE,
  };
  return dynamoDb.putItem(params, (error, data) => {
    if (error) throw error
    console.log(data)
  });
}



module.exports.handler = serverless(app);
