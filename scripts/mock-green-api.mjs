// Local GREEN-API emulator for trying the chat without a real instance.
// Implements the methods the app uses: getStateInstance, sendMessage,
// receiveNotification and deleteNotification. Every sent message gets
// "delivered" and "read" statuses and an automatic reply from the recipient.
//
// Run: npm run mock, then log in with apiUrl http://localhost:3999 and any
// idInstance / apiTokenInstance (the token "wrong" emulates bad credentials).

import http from 'node:http'

const PORT = Number(process.env.PORT) || 3999

const queue = []
let nextReceiptId = 1
let nextMessageId = 1
let greeted = false

function notify(body, delayMs = 0) {
  setTimeout(() => {
    queue.push({ receiptId: nextReceiptId++, body: { timestamp: Math.floor(Date.now() / 1000), ...body } })
  }, delayMs)
}

function textMessage(text) {
  return { typeMessage: 'textMessage', textMessageData: { textMessage: text } }
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data ? JSON.parse(data) : {}))
  })
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') return res.end()

  // /waInstance{id}/{method}/{token}[/{receiptId}]
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const [, , method, token, receiptId] = url.pathname.split('/')
  console.log(req.method, method)

  if (token === 'wrong') return sendJson(res, 401, { error: 'Unauthorized' })

  switch (method) {
    case 'getStateInstance':
      if (!greeted) {
        greeted = true
        notify(
          {
            typeWebhook: 'incomingMessageReceived',
            idMessage: `IN${nextMessageId++}`,
            senderData: { chatId: '79161112233@c.us', senderName: 'Служба поддержки' },
            messageData: textMessage('Здравствуйте! Это тестовый собеседник из эмулятора GREEN-API.'),
          },
          1000,
        )
      }
      return sendJson(res, 200, { stateInstance: 'authorized' })

    case 'sendMessage': {
      const { chatId, message } = await readBody(req)
      if (!chatId || !message) return sendJson(res, 400, { error: 'chatId and message are required' })
      const idMessage = `OUT${nextMessageId++}`
      notify({ typeWebhook: 'outgoingAPIMessageReceived', idMessage, senderData: { chatId }, messageData: textMessage(message) })
      notify({ typeWebhook: 'outgoingMessageStatus', idMessage, chatId, status: 'delivered' }, 500)
      notify({ typeWebhook: 'outgoingMessageStatus', idMessage, chatId, status: 'read' }, 1500)
      notify(
        {
          typeWebhook: 'incomingMessageReceived',
          idMessage: `IN${nextMessageId++}`,
          senderData: { chatId },
          messageData: textMessage(`Получил: «${message}»`),
        },
        2500,
      )
      return sendJson(res, 200, { idMessage })
    }

    case 'receiveNotification': {
      const timeoutMs = (Number(url.searchParams.get('receiveTimeout')) || 5) * 1000
      const startedAt = Date.now()
      const poll = () => {
        if (queue.length > 0) return sendJson(res, 200, queue[0])
        if (Date.now() - startedAt >= timeoutMs || res.destroyed) return sendJson(res, 200, null)
        setTimeout(poll, 200)
      }
      return poll()
    }

    case 'deleteNotification': {
      const index = queue.findIndex((n) => n.receiptId === Number(receiptId))
      if (index >= 0) queue.splice(index, 1)
      return sendJson(res, 200, { result: index >= 0 })
    }

    default:
      return sendJson(res, 404, { error: `Unknown method ${method}` })
  }
})

server.listen(PORT, () => {
  console.log(`GREEN-API emulator: http://localhost:${PORT}`)
})
