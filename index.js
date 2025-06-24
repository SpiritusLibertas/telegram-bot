const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const { google } = require('googleapis');
require('dotenv').config();
const TOKEN = '7591593436:AAEgOBitSVUCsvIWw7Y1rMTRXpeKupcJVVg'; // Перевір токен!
const SHEET_NAME = 'Лист1';
const CHANNEL_URL = 'https://t.me/Rentlogin_click';
const SHEET_ID = '1IK-Vx0KI-D0tx_4If34YGOmBgocm9FNwtwoTNPPJtUs';

const app = express();
app.use(bodyParser.json());

const CLIENT_EMAIL = process.env.CLIENT_EMAIL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const auth = new google.auth.GoogleAuth({
  credentials: { client_email: CLIENT_EMAIL, private_key: PRIVATE_KEY.replace(/\\n/g, '\n') },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

let chatStates = {};

app.post('/', async (req, res) => {
  console.log('Received POST request:', JSON.stringify(req.body));
  try {
    const { message } = req.body;
    if (!message) {
      console.log('No message in request');
      return res.status(400).json({ status: 'error', message: 'Invalid or missing message' });
    }

    const chatId = message.chat?.id;
    const userText = message.text || '';
    const messageId = message.message_id || 0;

    console.log(`Processing - Chat ID: ${chatId}, Text: ${userText}, Message ID: ${messageId}`);

    if (!chatId) {
      console.log('Chat ID is undefined');
      return res.status(400).json({ status: 'error', message: 'Chat ID is undefined' });
    }

    if (!chatStates[chatId]) {
      console.log(`Initializing state for Chat ID: ${chatId}`);
      chatStates[chatId] = { step: 0, responses: {}, messageIds: [] };
    }
    const state = chatStates[chatId];

    console.log(`Checking step: ${state.step}, userText: "${userText}"`);
    if (state.step === 0 && userText === '/start') { // Зміна умови на '/start'
      console.log(`Step 0 triggered for ${chatId} with /start`);
      state.step = 0;
      state.responses = {};
      state.messageIds = [];
      sendMessageWithButtons(chatId,
        '?? *Вітаємо в боті LRconverter!*\n' +
        '?? Цей бот допомагає мені зібрати інформацію від тих, з ким я співпрацюю.\n' +
        '?? *Запевняю:* запитання безпечні та не витягують конфіденційних даних!\n' +
        '?? Твоя інформація потрібна лише для нашої спільної роботи.\n' +
        '_Натисни "Продовжити", щоб почати._',
        [['? Продовжити']], 'Markdown');
      console.log(`Sent welcome message to ${chatId}`);
      return res.json({ status: 'ok', message: 'Welcome sent' });
    }

    if (state.step === 0 && userText === 'Продовжити') {
      console.log(`User clicked "Продовжити" on ${chatId}, moving to step 1`);
      state.step = 1;
      sendMessage(chatId, '?? *1??/16: Як тебе звати?* _Введи ім’я та прізвище._', 'Markdown');
      console.log(`Sent step 1 message to ${chatId}`);
      return res.json({ status: 'ok' });
    }

    return res.json({ status: 'ok' }); // Тимчасове повернення для дебагу
  } catch (error) {
    console.error('Error:', error.toString());
    return res.status(500).json({ status: 'error', message: error.toString() });
  }
});

function sendMessage(chatId, text, parseMode = 'Markdown') {
  console.log(`Sending message to ${chatId}: ${text}`);
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const payload = { chat_id: chatId, text, parse_mode: parseMode };
  https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
    res.on('data', (data) => console.log(`Response from Telegram: ${data}`));
    res.on('error', (err) => console.error(`Telegram error: ${err.message}`));
  }).end(JSON.stringify(payload));
}

function sendMessageWithButtons(chatId, text, buttons, parseMode = 'Markdown') {
  console.log(`Sending message with buttons to ${chatId}: ${text}`);
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: parseMode,
    reply_markup: { keyboard: [buttons], one_time_keyboard: true, resize_keyboard: true },
  };
  https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
    res.on('data', (data) => console.log(`Response from Telegram: ${data}`));
    res.on('error', (err) => console.error(`Telegram error: ${err.message}`));
  }).end(JSON.stringify(payload));
}

function sendDeleteMessage(chatId, messageId) {
  console.log(`Deleting message ${messageId} from ${chatId}`);
  const url = `https://api.telegram.org/bot${TOKEN}/deleteMessage`;
  https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
    res.on('data', () => {});
  }).end(JSON.stringify({ chat_id: chatId, message_id: messageId }));
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));