const fetch = require('node-fetch')
const ical = require('ical')
const moment = require('moment-timezone')

const { proxyResponse } = require('./util.js')

const ICAL_URL = 'https://linkkijkl.fi/tapahtumat/list/?ical=1&tribe_display=list'

const getEvents = async (event) => {
  const url = ICAL_URL
  const days = (event.queryStringParameters &&
    event.queryStringParameters.days) ||
    30
  const limit = (event.queryStringParameters &&
    event.queryStringParameters.limit) ||
    Infinity

  const e = await fetch(url)
    .then(res => res.text())
    .then(body => ical.parseICS(body))
    .then(json => {
      return Object.values(json)
        .map(event => ({
          title: event.summary,
          date: event.start
        }))
        .filter(event => event.title && event.date)
    })
    .then(events => events.map(
      event => {
        return Object.assign(
          {},
          event,
          { date: moment(event.date) }
        )
      }
    ))
    .then(events => events.filter(
      event => event.date.isBefore(
        moment().add(days, 'days')
      )
    )
      .slice(0, limit)
      .map(
        event => {
          return Object.assign(
            {},
            event,
            { date: event.date.format('DD.MM.') }
          )
        }
      )
    )
    .catch((e) => {
      console.log(e)
      return null
    })

  return proxyResponse(
    e ? 200 : 500, e
  )
}

module.exports = { getEvents }
