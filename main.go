package main

import (
	"log"
	"net/http"
	"sync"
	"text/template"

	"github.com/gorilla/websocket"
)

// Estrutura para representar a mensagem enviada pelo cliente
type Message struct {
	Type     string `json:"type"`
	Username string `json:"username"`
	Value    string `json:"value"`
}

// Estrutura para manter o estado de uma sala
type Room struct {
	sync.Mutex
	Name      string
	Members   map[string]*websocket.Conn
	Estimates map[string]string
	Revealed  bool
}

// Gerenciador de salas
type RoomManager struct {
	sync.Mutex
	Rooms map[string]*Room
}

// Upgrader para WebSockets
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var manager = &RoomManager{
	Rooms: make(map[string]*Room),
}

// Handler para a página principal
func homeHandler(w http.ResponseWriter, r *http.Request) {
	tmpl, err := template.ParseFiles("./static/index.html")
	if err != nil {
		http.Error(w, "Could not load template", http.StatusInternalServerError)
		return
	}
	tmpl.Execute(w, nil)
}

// Handler para a conexão WebSocket
func wsHandler(w http.ResponseWriter, r *http.Request) {
	roomName := r.URL.Query().Get("room")
	if roomName == "" {
		http.Error(w, "Room name is required", http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade failed:", err)
		return
	}
	defer conn.Close()

	manager.Lock()
	if _, ok := manager.Rooms[roomName]; !ok {
		manager.Rooms[roomName] = &Room{
			Name:      roomName,
			Members:   make(map[string]*websocket.Conn),
			Estimates: make(map[string]string),
			Revealed:  false,
		}
	}
	room := manager.Rooms[roomName]
	manager.Unlock()

	// Loop para receber e processar mensagens do cliente
	for {
		var msg Message
		err := conn.ReadJSON(&msg)
		if err != nil {
			log.Println("Read failed:", err)
			room.Lock()
			// Remover o membro da sala se a conexão cair
			for name, c := range room.Members {
				if c == conn {
					delete(room.Members, name)
					break
				}
			}
			room.Unlock()
			broadcast(room, "init")
			break
		}

		processMessage(room, conn, msg)
	}
}

// Processa a mensagem recebida e atualiza o estado da sala
func processMessage(room *Room, conn *websocket.Conn, msg Message) {
	room.Lock()
	defer room.Unlock()

	switch msg.Type {
	case "join":
		room.Members[msg.Username] = conn
		log.Printf("%s joined room %s", msg.Username, room.Name)
	case "estimate":
		room.Estimates[msg.Username] = msg.Value
		log.Printf("%s estimated %s in room %s", msg.Username, msg.Value, room.Name)
	case "reveal":
		room.Revealed = true
		log.Printf("Estimates revealed in room %s", room.Name)
	case "reset":
		room.Estimates = make(map[string]string)
		room.Revealed = false
		log.Printf("Room %s reset", room.Name)
	}

	broadcast(room, msg.Type)
}

// Envia o estado atual da sala para todos os membros
func broadcast(room *Room, msgType string) {
	// Cria uma estrutura de dados para o cliente
	clientState := map[string]interface{}{
		"estimates":   room.Estimates,
		"revealed":    room.Revealed,
		"members":     []string{},
		"messageType": msgType,
	}
	for name := range room.Members {
		clientState["members"] = append(clientState["members"].([]string), name)
	}

	for username, conn := range room.Members {
		if !room.Revealed {
			// Esconde a estimativa dos outros até que sejam reveladas
			hiddenEstimates := make(map[string]string)
			for member := range room.Estimates {
				hiddenEstimates[member] = "Votou"
			}
			clientState["estimates"] = hiddenEstimates
		}

		err := conn.WriteJSON(clientState)
		if err != nil {
			log.Println("Write failed:", err)
			conn.Close()
			delete(room.Members, username)
		}
	}
}

func main() {
	// Serve a página principal
	http.HandleFunc("/", homeHandler)
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("./static"))))
	// Trata a conexão WebSocket
	http.HandleFunc("/ws", wsHandler)

	log.Println("Server started on :8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
