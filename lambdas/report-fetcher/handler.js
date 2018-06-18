const serverless = require('serverless-http');
const express = require('express');
const axios = require('axios');
const moment = require('moment')

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const app = express()

app.get('/', function (req, res) {
  const startDate = moment().subtract(1, 'day').valueOf()
  const endDate = moment().valueOf()
  axios.get(`https://rex2hkddx4.execute-api.us-east-1.amazonaws.com/prod/reports?startDate=${startDate}&endDate=${endDate}`)
    .then(reportsResponse => {
      const reportIds = reportsResponse.data['reportIds']
      console.debug('fetching reportIds: ' + JSON.stringify(reportIds))
      const writeResponses = reportIds.map(requestAndStoreReportData)

      let allSuccess = true
      let successCount = 0
      writeResponses.forEach(writeResponse => {
        if (!writeResponse.success) {
          allSuccess = false
        } else {
          successCount += 1;
        }
      })

      const responseBody = allSuccess ?
        {'message': `successfully saved ${successCount} reports`} :
        {'message': 'failed to write reports'}
      // res.header("Access-Control-Allow-Origin", "*");
      res.status(allSuccess ? 200 : 500)
      res.json(responseBody);
    })
    .catch(error => {
      console.log(error);
      res.json({'message': 'failed to write reports'});
    });
})

const requestAndStoreReportData = reportId =>
  axios.get(`https://rex2hkddx4.execute-api.us-east-1.amazonaws.com/prod/reports/${reportId}`)
    .then(response => {
      console.log(`fetched reportId: ${reportId}`)
      return writeToDynamo(response.data)
    })
    .catch(error => {
      console.log(error);
      return {success: false}
    })

const writeToDynamo = (reportData) => {
  reportData = addScoreToReport(reportData);
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: reportData,
  };
  return dynamoDb.put(params, (error) => {
    // handle potential errors
    if (error) {
      console.log(error)
      return {
        success: false,
        statusCode: error.statusCode || 501,
        error: error,
      }
    }

    return {
      success: true
    }
  });
}

function addScoreToReport(reportData){
  let ourScore = -1;
  let priorityLevel = reportData['additionalNcmecInformation']['priority']['priorityId'];
  if(priorityLevel == "1")
    ourScore = 1;
  else if(priorityLevel == "2")
    ourScore = 0.5;
  else if(priorityLevel == "3")
    ourScore = 0;
  if (ourScore >= 0)
    reportData['ourScore'] = ourScore;
  return reportData;
}

module.exports.handler = serverless(app);
