const serverless = require('serverless-http');
const express = require('express');
const axios = require('axios');
const moment = require('moment')
const _ = require('lodash')

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const machinelearning = new AWS.MachineLearning();

const app = express()

app.get('/', function (req, res) {
  const startDate = moment().subtract(1, 'day').valueOf()
  const endDate = moment().valueOf()
  axios.get(`${process.env.REPORT_API_BASE_URL}reports?startDate=${startDate}&endDate=${endDate}`)
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
      // res.json(responseBody);
      res.json({'message': 'finished scoring reports'})
    })
    .catch(error => {
      console.log(error);
      res.json({'message': 'failed to write reports'});
    });
})

const requestAndStoreReportData = (reportId) =>
  axios.get(`${process.env.REPORT_API_BASE_URL}/reports/${reportId}`)
    .then(response => {
      console.log(`fetched reportId: ${reportId}`)
      const reportData = response.data
      addScoreToReport(reportData, (reportData) => {
        return writeToDynamo(reportData)
      });
    })
    .catch(error => {
      console.log(error);
      return {success: false}
    })

const writeToDynamo = (reportData) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: reportData,
  };
  console.log(`writing report ${reportData['reportId']} to database`)
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

function addScoreToReport(reportData, callback) {
  // addDummyScoreToReport(reportData, callback)
  addMLScoreToReport(reportData, callback)
  // return process.env['USE_ML_PREDICTION_SCORE'] === 'TRUE' ?
  //   addDummyScoreToReport(reportData, callback) :
  //   addMLScoreToReport(reportData, callback)

}

function addDummyScoreToReport(reportData, callback) {
  let thornScore = -1;
  let priorityLevel = reportData['additionalNcmecInformation']['priority']['priorityId'];
  if(priorityLevel == "1")
    thornScore = 1;
  else if(priorityLevel == "2")
    thornScore = 0.5;
  else if(priorityLevel == "3")
    thornScore = 0;
  if (thornScore >= 0)
    reportData['ThornScore'] = thornScore;

  callback(reportData)
}

function addMLScoreToReport(reportData, callback) {
  const PriorityLevel = '' + reportData['additionalNcmecInformation']['priority']['priorityId']
  const incidentDateTime = reportData['reportedInformation']['incidentSummary']['incidentDateTime']
  const daysToExpiration = '' +  moment().diff(moment(incidentDateTime).add(90, 'days'), 'days')
  const uploadedFiles = reportData['reportedInformation']['uploadedFiles']
  const uploadedFilesNum = '' + (uploadedFiles ? (uploadedFiles['uploadedFiles'].length) : 0)
  let Immediate = uploadedFiles ? _.some(uploadedFiles['uploadedFiles'], file => file['industryClassification'] === 'A1') : false
  Immediate = Immediate ? '1' : '0'

  // TODO (1: unique, 0: non-unique)
  getUniqueness('1', {
    PriorityLevel,
    daysToExpiration,
    uploadedFilesNum,
    Immediate,
  }, reportData, callback)
  // axios.post(`${process.env.PHOTO_DNA_BASE_URL}`)
  //   .then(response => getUniqueness(response['Uniqueness']))
}

const getUniqueness = (uniqueness, record, reportData, callback) => {
  record['Uniqueness'] = uniqueness
  const params = {
    MLModelId: process.env.ML_MODEL_ID,
    PredictEndpoint: process.env.PREDICT_ENDPOINT,
    Record: record
  };
  machinelearning.predict(params, function(err, data) {
    if (err) throw err
    // PredictedLabel for categorization
    // PredictedValue for regression
    console.log(`Prediction data: ${JSON.stringify(data)}`)
    reportData['ThornScore'] = +data['Prediction']['predictedLabel']
    callback(reportData)
  });
}


module.exports.handler = serverless(app);
