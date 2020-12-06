const fetch = require('node-fetch')

const { proxyResponse, getDate } = require('./util.js')

const RESTAURANT_IDS = {
  maija: '207659',
  piato: '207735',
  tilia: '207412',
  libri: '207559',
  cafe_libri: '207643',
  lozzi: '207272',
  belvedere: '207354',
  syke: '207483',
  uno: '207190',
  ylisto: '207103',
  kvarkki: '207038',
  rentukka: '206838',
  novelli: '206964',
  normaalikoulu: '206878'
}

const getMeals = async (event) => {
  const id = RESTAURANT_IDS[event.pathParameters.restaurant]

  if (id === undefined) {
    return proxyResponse(
      400,
      { errorMessage: 'Unknown restaurant' }
    )
  }

  const date = getDate()

  const res = await fetch(
    url(id, date)
  ).then(r => r.json())

  const todayMeals = parseTodayMeals(res)

  return proxyResponse(200, todayMeals)
}

const url = (restaurantId, date) => {
  return 'https://www.semma.fi/api/restaurant/menu/day' +
    '?language=fi' +
    `&restaurantPageId=${restaurantId}` +
    `&date=${date}`
}

const parseTodayMeals = (json) =>
  json.LunchMenu.SetMenus
    .map(m => m.Meals)
    .map(m => m.map(x => x.Name))
    .map(m => m.map(x => x.replace(/(\t| )*/, ' ')))
		.map(m => m.map(x => x.replace(/ *(\*|VEG|[A-Z])($|,) */g, '')))
    .map(m => m.map(x => x.trim()))
    .filter(m => m.length > 0)

module.exports = { getMeals }
