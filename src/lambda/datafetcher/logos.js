const cheerio = require('cheerio')
const fetch = require('node-fetch')

const { proxyResponse } = require('./util.js')

const getLogos = async (event) => {
  return fetch('http://linkkijkl.fi/')
    .then(res => res.text())
    .then(html => {
      const $ = cheerio.load(html)
      return Array.from(
        $('.textwidget').find('img')
      ).map(elem =>
        elem.attribs.src.trim()
      )
    })
    .then(urls => proxyResponse(200, urls))
    .catch(() => proxyResponse(
      500, {errorMessage: 'Couldn\'t fetch URLs'}
    ))
}

module.exports = { getLogos }
