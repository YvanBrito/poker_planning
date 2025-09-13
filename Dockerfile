# Build stage
FROM golang:1.25.1-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o planning_poker

# Final stage
FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/planning_poker .
COPY static ./static

EXPOSE 8080

CMD ["./planning_poker"]