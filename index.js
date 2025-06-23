const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const { google } = require('googleapis');
const TOKEN = '7591593436:AAEgOBitSVUCsvIWw7Y1rMTRXpeKupcJVVg'; // Твій токен
const SHEET_NAME = 'Лист1';
const CHANNEL_URL = 'https://t.me/Rentlogin_click';
const SHEET_ID = '1IK-Vx0KI-D0tx_4If34YGOmBgocm9FNwtwoTNPPJtUs'; // Твій SHEET_ID

const app = express();
app.use(bodyParser.json());

// Налаштування Google Sheets API (потрібно додати авторизацію)
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: 'твій_client_email', // Заміни на email із JSON-ключа
    private_key: 'твій_private_key'.replace(/\\n/g, '\n'), // Заміни на ключ із JSON
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

let chatStates = {}; // Зберігання стану для кожного чату

app.post('/', async (req, res) => {
  const { message } = req.body;
  const chatId = message?.chat?.id;
  const userText = message?.text || '';
  const messageId = message?.message_id || 0;

  if (!chatId) {
    res.json({ status: 'error', message: 'Chat ID is undefined' });
    return;
  }

  console.log(`Chat ID: ${chatId}, Text: ${userText}`);

  if (!chatStates[chatId]) {
    chatStates[chatId] = { step: 0, responses: {}, messageIds: [] };
  }
  const state = chatStates[chatId];

  if (userText === '/start') {
    state.step = 0;
    state.responses = {};
    state.messageIds = [];
    sendMessage(chatId, '?? *Вітаємо в боті LRconverter!*\n_Натисни "Продовжити", щоб почати._', [['? Продовжити']]);
    res.json({ status: 'ok', message: 'Welcome sent' });
    return;
  }

  if (state.step === 0 && userText === 'Продовжити') {
    state.step = 1;
    sendMessage(chatId, '?? *1??/16: Як тебе звати?* _Введи ім’я та прізвище._');
    res.json({ status: 'ok' });
    return;
  }

  // Логіка для інших кроків (спрощена, додай за потребою)
  switch (state.step) {
    case 1:
      state.responses.name = userText;
      state.step = 2;
      sendMessage(chatId, '?? *2??/16: Скільки тобі років?* _Введи число._');
      break;
    case 2:
      state.responses.age = userText;
      state.step = 3;
      sendMessage(chatId, '?? *3??/16: У якому місті / країні живеш?* _Наприклад, Київ, Україна._');
      break;
    // Додай інші кроки (3-15) за аналогією
    case 15:
      state.responses.comment = userText;
      state.responses.timestamp = new Date().toLocaleString();
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A:Z`,
        valueInputOption: 'RAW',
        resource: { values: [Object.values(state.responses)] },
      });
      state.messageIds.forEach(msgId => sendDeleteMessage(chatId, msgId));
      sendMessage(chatId, `?? *Дякуємо за заповнення анкети!*\n?? Підпишись на канал: [${CHANNEL_URL}]`, [['? Підписатися']]);
      delete chatStates[chatId];
      break;
  }

  if (state.step > 0 && state.step < 15) state.step++;
  res.json({ status: 'ok' });
});

function sendMessage(chatId, text, buttons = []) {
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown',
    reply_markup: buttons.length ? { keyboard: [buttons], one_time_keyboard: true, resize_keyboard: true } : undefined,
  };
  https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
    res.on('data', () => {});
  }).end(JSON.stringify(payload));
}

function sendDeleteMessage(chatId, messageId) {
  const url = `https://api.telegram.org/bot${TOKEN}/deleteMessage`;
  https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
    res.on('data', () => {});
  }).end(JSON.stringify({ chat_id: chatId, message_id: messageId }));
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));