import HomePage from './HomePage.js'
import Poker from './Poker.js'
import { roomUsernamestore } from './store.js'

customElements.define('home-page', HomePage)
customElements.define('poker-page', Poker)

roomUsernamestore.subscribe((state) => {
  if (state.roomName !== '')
    document.getElementById('app').innerHTML = '<poker-page></poker-page>'
})

document.getElementById('app').innerHTML = '<home-page></home-page>'
