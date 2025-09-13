import { roomUsernamestore } from './store.js'
const sheet = new CSSStyleSheet()
await sheet.replace(
  await fetch('/static/styles/Poker.css').then((r) => r.text()),
)

class Poker extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.adoptedStyleSheets = [sheet]
    this.socket = new WebSocket(
      `ws://poker-planning-b8bj.onrender.com/ws?room=${
        roomUsernamestore.getState().roomName
      }`,
    )

    this.socket.onopen = () => {
      console.log('Conectado à sala:', roomUsernamestore.getState().roomName)
      this.socket.send(
        JSON.stringify({
          type: 'join',
          username: roomUsernamestore.getState().username,
        }),
      )
    }

    this.socket.onmessage = (event) => {
      const state = JSON.parse(event.data)
      this.updateUI(state)
    }

    this.socket.onclose = () => {
      console.log('Desconectado.')
    }
  }

  rmvSelectedBtns = () => {
    this.shadowRoot.querySelectorAll('.estimateBtn').forEach((btn) => {
      btn.classList.remove('selected')
    })
  }

  updateUI(state) {
    console.log(state)
    // if (state.estimates[roomUsernamestore.getState().username]) {
    //   this.shadowRoot.getElementById('myEstimate').textContent =
    //     state.estimates[roomUsernamestore.getState().username]
    // }
    if (state.messageType === 'reset') this.rmvSelectedBtns()

    const partipants = this.shadowRoot.getElementById('partipants')
    partipants.innerHTML = `${Object.keys(state.estimates).length ?? 0}/${
      state.members.length
    } participantes votaram`

    const totalMembers = this.shadowRoot.getElementById('totalMembers')
    totalMembers.innerHTML = `Participantes (${state.members.length})`
    const membersList = this.shadowRoot.getElementById('membersList')
    membersList.innerHTML = ''
    state.members
      .slice() // cria uma cópia para não modificar o array original
      .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
      .forEach((member) => {
        const memberDiv = document.createElement('div')
        memberDiv.className = 'member'
        const preposicoes = ['de', 'da', 'do', 'das', 'dos']
        const initials = member
          .split(' ')
          .filter((word) => word && !preposicoes.includes(word.toLowerCase()))
          .slice(0, 2)
          .map((word) => word[0].toUpperCase())
          .join('')
        const value = state.estimates[member] ?? 'Aguardando...'
        const valueHtml =
          value === 'Aguardando...' || value === 'Votou'
            ? value
            : `<span class="result">${value}</span>`
        memberDiv.innerHTML = `<div class="avatar">${initials}</div><div class="member-info"><strong>${member}</strong> ${valueHtml}</div>`
        membersList.appendChild(memberDiv)
      })
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <div class="wrapper">
        <div class="container top">
          <div class="room-info">
            <h2>${roomUsernamestore.getState().roomName}</h2>
            <p id="partipants"></p>
          </div>
          <div class="controls">
            <button id="revealEstimates">Revelar</button>
            <button id="resetEstimates">Nova Rodada</button>
          </div>
        </div>
        <div class="footer">
          <div class="container middle">
            <h3>Escolha sua estimativa</h3>
            <div class="estimation-cards">
              <button class="estimateBtn" data-value="PP">PP</button>
              <button class="estimateBtn" data-value="P">P</button>
              <button class="estimateBtn" data-value="M">M</button>
              <button class="estimateBtn" data-value="G">G</button>
              <button class="estimateBtn" data-value="GG">GG</button>
              <button class="estimateBtn" data-value="?">?</button>
            </div>
          </div>
          <div class="container bottom">
            <h3 id="totalMembers">Participantes</h3>
            <div id="membersList"></div>
          </div>
        </div>
      </div>
      `

    this.shadowRoot.querySelectorAll('.estimateBtn').forEach((btn) => {
      btn.onclick = () => {
        const estimate = btn.getAttribute('data-value')
        this.rmvSelectedBtns()
        btn.classList.add('selected')
        if (this.socket) {
          this.socket.send(
            JSON.stringify({
              type: 'estimate',
              username: roomUsernamestore.getState().username,
              value: estimate,
            }),
          )
        }
      }
    })

    this.shadowRoot.getElementById('revealEstimates').onclick = () => {
      if (this.socket) {
        this.socket.send(
          JSON.stringify({
            type: 'reveal',
            username: roomUsernamestore.getState().username,
          }),
        )
      }
    }
    this.shadowRoot.getElementById('resetEstimates').onclick = () => {
      if (this.socket) {
        this.socket.send(
          JSON.stringify({
            type: 'reset',
            username: roomUsernamestore.getState().username,
          }),
        )
      }
    }
  }

  disconnectedCallback() {
    this.unsubscribe()
  }
}

export default Poker
