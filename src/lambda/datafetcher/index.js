const { getEvents } = require('./events.js')
const { getMeals } = require('./meals.js')
const { getLogos } = require('./logos.js')

const delegates = {
  events: getEvents,
  logos: getLogos,
  restaurants: getMeals
}

const fallback = () => ({
  statusCode: 400,
  body: JSON.stringify({ errorMessage: 'Unknown op' })
})

exports.handler = async (event) => {
  const path = event.path || ''
  const resource = path.split('/')[1]
  const delegate = delegates[resource] || fallback
  return delegate(event)
}

