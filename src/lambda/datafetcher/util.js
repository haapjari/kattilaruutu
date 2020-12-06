const moment = require('moment-timezone')

const TZ = 'Europe/Helsinki'
const LOC = 'fi'
const CORS_HEADERS = {
  "X-Requested-With": '*',
  "Access-Control-Allow-Headers": 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,x-requested-with',
  "Access-Control-Allow-Origin": '*',
  "Access-Control-Allow-Methods": 'POST,GET,OPTIONS'
}

const proxyResponse = (statusCode, body) => ({
  statusCode,
  body: JSON.stringify(body),
  headers: CORS_HEADERS,
})

const getDate = () => {
  return moment()
    .tz(TZ)
    .locale(LOC)
    .format('YYYY-M-D')
}

module.exports = {
  getDate,
  proxyResponse
}

