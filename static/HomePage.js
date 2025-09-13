import { roomUsernamestore } from './store.js'

class HomePage extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <h1>Home Page</h1>
      <input id="userName" placeholder="Seu nome" />
      <input id="roomName" placeholder="Nome da Sala" />
      <button id="createRoomBtn">Criar Sala</button>
    `

    this.shadowRoot.getElementById('createRoomBtn').onclick = () => {
      const room = this.shadowRoot.getElementById('roomName').value
      const user = this.shadowRoot.getElementById('userName').value

      roomUsernamestore.setState({ roomName: room, username: user })
    }
  }
}

export default HomePage
