export function createStore(initialState) {
  let state = { ...initialState }
  const listeners = new Set()

  return {
    getState: () => state,
    setState: (newState) => {
      state = { ...state, ...newState }
      listeners.forEach((listener) => listener(state))
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export const roomUsernamestore = createStore({ roomName: '', username: '' })
