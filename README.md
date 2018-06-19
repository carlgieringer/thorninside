# Thorn in the Side of Bad Guy's Backsides

A serverless system for augmenting NCMEC reports with machine learned relevancy score.

[Slides](https://docs.google.com/presentation/d/1VhqUs9Dztzd3OKCPIYSpDdxGON4GaxDM3dbAak4RW1E/edit#slide=id.p)
[Architecture diagram](https://docs.google.com/drawings/d/1d6iMlq7JZrqGOLsHfCE15ByNflGZbqqOJZqRIUK7oC8/edit?usp=sharing)

## Deploy Serverless Architecture

```
# configure AWS credentials: https://docs.aws.amazon.com/sdk-for-java/v1/developer-guide/setup-credentials.html
npm install -g serverless
# For each lambda:
cd <lambda directory>
yarn install
sls deploy
```

Copy the URL for the NCMEC Report API into `REPORT_API_BASE_URL`

The deploy for scored-reports will output the API Gateway URL.  This is where a client can request all
reports with the ThornScore.

## Train Model

* Get features to CSV.  
* Create new AWS Machine Learning Model and Dataset.  
* Expose model using a real-time API
* Copy the URL into `PREDICT_ENDPOINT` and the model ID into `ML_MODEL_ID`.


## TODO

* Automatically generate features
* Retrain model on schedule
* Test API for receiving upvote/downvotes 