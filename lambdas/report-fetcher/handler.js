const serverless = require('serverless-http');
const express = require('express');
const axios = require('axios');
const app = express()

app.get('/', function (req, res) {
  axios.get('https://rex2hkddx4.execute-api.us-east-1.amazonaws.com/prod/reports')
    .then(response => {
      // write to S3
      res.send(response.data)
    })
    .catch(error => {
      console.log(error);
    });
})

module.exports.handler = serverless(app);
