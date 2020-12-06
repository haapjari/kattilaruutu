import React, { PureComponent } from 'react';
import { css } from 'react-emotion';
import PacmanLoader from 'react-spinners/PacmanLoader';
import ReactAnimationFrame from 'react-animation-frame';

import './App.scss';
import './fonts.css'
import noise from './img/noise.png'

const ENV = process.env.REACT_APP_ENV || 'dev'
const API_URL = {
  dev: 'https://api-dev.linkki.link',
  prod: 'https://api.linkki.link'
}[ENV]

const KK_URL = 'https://loota.xyz/kahvikamera.jpg'

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const override = css`
  display: block;
  margin: 0 auto;
`;

class _Meals extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      menu: [],
      menuStr: '',
      loading: true,
      error: false
    }
  }

  updateMeals() {
    this.setState({
      loading: true
    })

    fetch(`${API_URL}/restaurants/piato`)
      .then(res => res.json())
      .then(menu => this.setState({
        menu,
        menuStr : 'Piatossa tänään: ' +
          menu.map(l => l.join(' & ')).join(' | ') + ' // ',
        loading: false,
        error: false
      }))
      .catch(() => this.setState({
        loading: false,
        error: true
      }))
  }

  onAnimationFrame() {
    this.setState(state => {
      const s = state.menuStr
      const newS = s.slice(1,s.length).concat(s.slice(0,1))
      return {
        menuStr: newS
      }
    })
  }

  componentDidMount() {
    this.updateMeals()
    this.updtInterval = setInterval(() => this.updateMeals(), HOUR)
  }

  render() {
    const { menu } = this.state
    let msg = <pre></pre>

    if (this.state.loading) {
      msg = <pre>Ladataan ruokalistaa...</pre>
    } else if (!this.state.error && !menuIsEmpty(menu)) {
      msg = <pre>{this.state.menuStr}</pre>
    }

    return (
      <div id="meals">
        <span id="mealsContent">
          { msg }
        </span>
      </div>
    )
  }
}

const Meals = ReactAnimationFrame(_Meals, 100)

class Events extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      events: [],
      loading: true
    }
  }

  updateEvents() {
    this.setState({
      events: [],
      loading: true
    })

    fetch(`${API_URL}/events?limit=12&days=60`)
      .then(res => res.json())
      .then(events => this.setState({
        events,
        loading: false
      }))
  }

  componentDidMount() {
    this.updateEvents()
    this.interval = setInterval(() => this.updateEvents(), HOUR)
  }

  render() {
    const { events, loading } = this.state

    return (
      <div
        id="events"
      >
        <h2>Tapahtumat:</h2>
        <ul>
          { spinner(loading) }
          { renderEvents(events) }
        </ul>
      </div>
    )
  }
}

class Kamera extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      timestamp: new Date().getTime()
    }
  }

  updateKahvikamera() {
    this.setState({
      timestamp: new Date().getTime()
    })
  }

  componentDidMount() {
    this.updateKahvikamera()
    this.interval = setInterval(() => this.updateKahvikamera(), 1000 * 30)
  }

  render() {
    return <div
      id="kamera"
      style={{
        backgroundImage:
          `url('${noise}'), url('${KK_URL}?${this.state.timestamp}')`
      }}>
      <span id="kkRec"></span>
      <span id="kkCaption">[Kahvikamera]</span>
    </div>
  }
}

const menuIsEmpty = (menu) =>
  !menu || menu.length === 0 || menu[0].length === 0

const renderEvents = (events) => {
  return (
    events.map((event, index) => {
      return (
        <li key={index}>
          { `[${event.date}] // ${event.title}` }
        </li>
      )
    })
  )
}

function imagesLoaded(parentNode) {
  const imgElements = [...parentNode.querySelectorAll("img")];
  for (let i = 0; i < imgElements.length; i += 1) {
    const img = imgElements[i];
    if (!img.complete) {
      return false;
    }
  }
  return true;
}

class Sponsors extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      logoUrls: [],
      loading: true
    }
  }

  updateSponsors() {
    this.setState({
      logoUrls: [],
      loading: true
    })

    fetch(`${API_URL}/logos`)
      .then(res => res.json())
      .then(logoUrls => this.setState({
        logoUrls: logoUrls.map(url => url.replace(/^\//, '')),
      }))
  }

  handleImgStateChange = () => {
    const loading = !imagesLoaded(this.logosElem)

    this.setState({
      loading: loading
    })
  }

  componentDidMount() {
    this.updateSponsors()

    this.interval = setInterval(() => this.updateSponsors(), DAY)
  }

  fullUrl = (path) => `${API_URL}/logos/${path}`

  render() {
    const { logoUrls } = this.state
    const hidden = { display: 'none', background: '#f0f' }
    const visible = { background: 'none' }

    return (
      <div
        id="sponsors"
      >
        <h2>Sponsored by:</h2>
        { spinner(this.state.loading, override) }
        <div
          id='sponsorsLogos'
          style={this.state.loading ? hidden : visible}
          ref={elem => this.logosElem = elem}
        >
          <ImageSwitcher
            imgUrls={logoUrls.map(this.fullUrl)}
            time={3 * SECOND}
            onLoadHandler={this.handleImgStateChange}
            className="sponsorImg"
          />
        </div>
      </div>
    )
  }
}

/*
 * props:
 *
 * imgUrls: array of image urls for switcher
 * time: time between image changes
 * className: class name for img element
 * onLoadHandler: function for handling load or error
 */
class ImageSwitcher extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      index: 0
    }
  }

  hidden = { display: 'none' }
  visible = { }

  componentDidMount() {
    this.interval = setInterval(
      () => this.setState(
        (state, props) => ({
          index: ((state.index + 1) % props.imgUrls.length) || 0
        })
      ), this.props.time
    )
  }
  render() {

    return this.props.imgUrls.map((url, index) => {
      const imgName = url.split('/').slice(-1)[0].split('.')[0]

      return <img
        alt={imgName}
        src={url}
        className={this.props.className}
        onLoad={this.props.onLoadHandler}
        onError={this.props.onLoadHandler}
        style={index === this.state.index ? this.visible : this.hidden}
      />
    })
  }
}

class App extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      lastModified: null
    }

    this.interval = setInterval(() => {
      fetch(window.location.href + 'index.html',
        { method: 'HEAD' }
      )
        .then(res => {
          const {lastModified} = this.state
          const lm = res.headers.get('last-modified')
          if (!!lastModified && lm !== lastModified) {
            window.location.reload(true)
          }
          this.setState({
            lastModified: res.headers.get('last-modified')
          })
        })
    }, 10 * SECOND)
  }

  render() {
    return (
      <div id="App">
        <Events />
        <Meals />
        <Kamera />
        <Sponsors />
      </div>
    );
  }
}

const spinner = (loading, _class='', color='#ffbf00') => (
  loading && <PacmanLoader
    heightUnit={'vh'}
    size={15}
    className={_class}
    loading={loading}
    color={color}
  />
)

export default App;
