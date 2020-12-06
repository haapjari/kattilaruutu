const AWS = require('aws-sdk')
const fetch = require('node-fetch')
const s3 = new AWS.S3()
const cheerio = require('cheerio')
const url = require('url')

const BUCKET = 'linkki-link-logocache-dev'

const CORS_HEADERS = {
  "X-Requested-With": '*',
  "Access-Control-Allow-Headers": 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,x-requested-with',
  "Access-Control-Allow-Origin": '*',
  "Access-Control-Allow-Methods": 'POST,GET,OPTIONS'
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return proxyResponse(
      400,
      {errorMessage: 'Invalid request'}
    )
  }

  if (!event.pathParameters) {
    return getLogos(event)
  }

  const path = event.pathParameters.proxy

  return s3.headObject({
    Bucket: BUCKET,
    Key: path
  }).promise()
    .catch((err) => {
      return getImgToS3(path)
    })
    .then(() => redirect(getLink(path)))
    .catch(err => proxyResponse(
      500,
      err
    ))
}

const proxyResponse = (statusCode, body, headers) => ({
  statusCode,
  body: (body === null) ? null : JSON.stringify(body),
  headers: Object.assign(
    {},
    CORS_HEADERS,
    headers
  )
})

const redirect = (url) => {
  return proxyResponse(
    301,
    null,
    { Location: url }
  )
}

const getLink = (key) => {
  return `https://linkki-link-logocache-dev.s3-eu-west-1.amazonaws.com/${key}`
}

const getImgToS3 = (path) => {
  console.log(`http://linkkijkl.fi/${path}`)
  return fetch(`http://linkkijkl.fi/${path}`)
    .then(res => {
      if (!res.ok) {
        throw res
      } else {
        return res.body
      }
    })
    .then(body => {
      console.log('got body')
      return s3.upload({
        Body: body,
        Bucket: BUCKET,
        Key: path,
        ACL: 'public-read'
      }).promise()
    })
}

const getLogos = async (event) => {
  return fetch('https://linkkijkl.fi/')
    .then(res => res.text())
    .then(html => {
      const $ = cheerio.load(html)
      return Array.from(
        $('#footer-content').find('img')
      ).map(elem => {
        const uri = elem.attribs.src.trim()
        const path = url.parse(uri).pathname
        return path
      })
    })
    .then(urls => proxyResponse(200, urls))
    .catch(() => proxyResponse(
      500, {errorMessage: 'Couldn\'t fetch URLs'}
    ))
}
