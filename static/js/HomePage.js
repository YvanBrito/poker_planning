import { roomUsernamestore } from './store.js'
const sheet = new CSSStyleSheet()
await sheet.replace(
  await fetch('/static/styles/HomePage.css').then((r) => r.text()),
)

class HomePage extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.adoptedStyleSheets = [sheet]
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
    <div class="container">
      <h1>Poker Planning</h1>
      <div class="form">
        <h3>Criar Sala de Poker</h3>
        <div>
          <label for="userName">Seu Nome</label>
          <input id="userName" name="userName" placeholder="Digite seu nome..." />
        </div>
        <div>
          <label for="roomName">Nome da Sala</label>
          <input id="roomName" name="roomName" placeholder="Digite o nome da sala..." />
        </div>
        <button disabled="true" id="createRoomBtn">Entrar na Sala</button>
      </div>
    </div>
    
    `

    const userInput = this.shadowRoot.getElementById('userName')
    const roomInput = this.shadowRoot.getElementById('roomName')
    const createBtn = this.shadowRoot.getElementById('createRoomBtn')

    function checkFields() {
      if (userInput.value.trim() && roomInput.value.trim()) {
        createBtn.disabled = false
      } else {
        createBtn.disabled = true
      }
    }

    userInput.oninput = checkFields
    roomInput.oninput = checkFields

    createBtn.onclick = () => {
      const room = roomInput.value
      const user = userInput.value
      roomUsernamestore.setState({ roomName: room, username: user })
    }
  }
}

export default HomePage
