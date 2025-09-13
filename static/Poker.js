import { roomUsernamestore } from './store.js'

class Poker extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.socket = new WebSocket(
      `ws://localhost:8080/ws?room=${roomUsernamestore.getState().roomName}`,
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

  updateUI(state) {
    const estimatesList = this.shadowRoot.getElementById('estimatesList')
    estimatesList.innerHTML = ''
    for (const user in state.estimates) {
      const card = document.createElement('div')
      card.className = 'card'
      card.textContent = `${user}: ${state.estimates[user]}`
      estimatesList.appendChild(card)
    }

    if (state.estimates[roomUsernamestore.getState().username]) {
      this.shadowRoot.getElementById('myEstimate').textContent =
        state.estimates[roomUsernamestore.getState().username]
    }

    const membersList = this.shadowRoot.getElementById('membersList')
    membersList.innerHTML = '<h3>Membros</h3>'
    state.members.forEach((member) => {
      const li = document.createElement('li')
      li.textContent = member
      membersList.appendChild(li)
    })
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        .estimates {
          background-color: red;
        }
      </style>
        <div id="game">
          <p>Sua estimativa: <span id="myEstimate"></span></p>
          <div class="estimates">
            <h2>Estimativas</h2>
            <div id="estimatesList"></div>
          </div>
          <button id="revealEstimates">Revelar</button>
          <button id="resetEstimates">Zerar</button>
          <div id="membersList"></div>
        </div>
        <div style="margin-top: 20px">
          <p>Selecione sua estimativa:</p>
          <button class="estimateBtn" data-value="PP">PP</button>
          <button class="estimateBtn" data-value="P">P</button>
          <button class="estimateBtn" data-value="M">M</button>
          <button class="estimateBtn" data-value="G">G</button>
          <button class="estimateBtn" data-value="GG">GG</button>
          <button class="estimateBtn" data-value="?">?</button>
        </div>
      `
    this.shadowRoot.querySelectorAll('.estimateBtn').forEach((btn) => {
      btn.onclick = () => {
        const estimate = btn.getAttribute('data-value')
        console.log('Estimativa selecionada:', estimate)
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
