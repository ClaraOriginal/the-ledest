const WebSocket = require('ws')
const dgram = require('dgram')

const WLED_IP = '192.168.7.122'
const UDP_PORT = 21324
const FIRST_CHUNK = 57 * 6   // 342
const SECOND_CHUNK = 57 * 3  // 171

const wss = new WebSocket.Server({ port: 9001 })
console.log('WebSocket→UDP bridge listening on ws://localhost:9001')

wss.on('connection', (ws) => {
  console.log('Client connected')

  ws.on('message', (message) => {
    // message is a binary buffer: flat array of [r, g, b, r, g, b, ...]
    const buf = Buffer.from(message)
    const totalPixels = buf.length / 3
    if (totalPixels !== FIRST_CHUNK + SECOND_CHUNK) {
      console.warn(`Expected ${FIRST_CHUNK + SECOND_CHUNK} pixels, got ${totalPixels}`)
    }

    const sock = dgram.createSocket('udp4')

    // --- First packet: Protocol 2 (DRGB), pixels 0..FIRST_CHUNK-1 ---
    const header1 = Buffer.from([2, 2])
    const rgb1 = buf.slice(0, FIRST_CHUNK * 3)
    const data1 = Buffer.concat([header1, rgb1])
    sock.send(data1, UDP_PORT, WLED_IP)

    // --- Second packet: Protocol 4 (DNRGB), pixels FIRST_CHUNK..end ---
    const startIndex = FIRST_CHUNK
    const header2 = Buffer.from([4, 2, (startIndex >> 8) & 0xFF, startIndex & 0xFF])
    const rgb2 = buf.slice(FIRST_CHUNK * 3, (FIRST_CHUNK + SECOND_CHUNK) * 3)
    const data2 = Buffer.concat([header2, rgb2])
    sock.send(data2, UDP_PORT, WLED_IP, () => {
      sock.close()
    })
  })

  ws.on('close', () => console.log('Client disconnected'))
})