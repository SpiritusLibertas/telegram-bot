const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const { google } = require('googleapis');
const TOKEN = '7591593436:AAEgOBitSVUCsvIWw7Y1rMTRXpeKupcJVVg'; // ��� �����
const SHEET_NAME = '����1';
const CHANNEL_URL = 'https://t.me/Rentlogin_click';
const SHEET_ID = '1IK-Vx0KI-D0tx_4If34YGOmBgocm9FNwtwoTNPPJtUs'; // ��� SHEET_ID

const app = express();
app.use(bodyParser.json());

// ������������ Google Sheets API (������� ������ �����������)
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: '���_client_email', // ����� �� email �� JSON-�����
    private_key: '���_private_key'.replace(/\\n/g, '\n'), // ����� �� ���� �� JSON
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

let chatStates = {}; // ��������� ����� ��� ������� ����

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
    sendMessage(chatId, '?? *³���� � ��� LRconverter!*\n_������� "����������", ��� ������._', [['? ����������']]);
    res.json({ status: 'ok', message: 'Welcome sent' });
    return;
  }

  if (state.step === 0 && userText === '����������') {
    state.step = 1;
    sendMessage(chatId, '?? *1??/16: �� ���� �����?* _����� ��� �� �������._');
    res.json({ status: 'ok' });
    return;
  }

  // ����� ��� ����� ����� (��������, ����� �� ��������)
  switch (state.step) {
    case 1:
      state.responses.name = userText;
      state.step = 2;
      sendMessage(chatId, '?? *2??/16: ������ ��� ����?* _����� �����._');
      break;
    case 2:
      state.responses.age = userText;
      state.step = 3;
      sendMessage(chatId, '?? *3??/16: � ����� ��� / ���� �����?* _���������, ���, ������._');
      break;
    // ����� ���� ����� (3-15) �� �����㳺�
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
      sendMessage(chatId, `?? *������ �� ���������� ������!*\n?? ϳ������� �� �����: [${CHANNEL_URL}]`, [['? ϳ���������']]);
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