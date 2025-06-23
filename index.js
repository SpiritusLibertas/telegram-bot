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

// ������������ Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: '���_client_email', // ����� �� email �� JSON-�����
    private_key: '���_private_key'.replace(/\\n/g, '\n'), // ����� �� ���� �� JSON
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

// ��������� ����� � ����� (������ PropertiesService)
let chatStates = {};

app.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.json({ status: 'error', message: 'Invalid or missing message' });
    }

    const chatId = message.chat?.id;
    const userText = message.text || '';
    const messageId = message.message_id || 0;

    console.log(`Chat ID: ${chatId}, Text: ${userText}, Message ID: ${messageId}`);

    if (!chatId) {
      return res.json({ status: 'error', message: 'Chat ID is undefined' });
    }

    if (!chatStates[chatId]) {
      chatStates[chatId] = { step: 0, responses: {}, messageIds: [] };
    }
    const state = chatStates[chatId];

    // ������ ���� ��� �������� �����
    if (state.step === 0 && !userText) {
      state.step = 0;
      state.responses = {};
      state.messageIds = [];
      sendMessageWithButtons(chatId, 
        '?? *³���� � ��� LRconverter!*\n' +
        '?? ��� ��� �������� ��� ������ ���������� �� ���, � ��� � ���������.\n' +
        '?? *��������:* ��������� ������� �� �� ��������� �������������� �����!\n' +
        '?? ���� ���������� ������� ���� ��� ���� ������ ������.\n' +
        '_������� "����������", ��� ������._', 
        [['? ����������']], 'Markdown');
      return res.json({ status: 'ok', message: 'Welcome sent' });
    }

    // ������� ����� 0 (������� �����������)
    if (state.step === 0 && userText === '����������') {
      state.step = 1;
      sendMessage(chatId, '?? *1??/16: �� ���� �����?* _����� ��� �� �������._', 'Markdown');
      return res.json({ status: 'ok' });
    }

    // ����� ��� ����� �����
    switch (state.step) {
      case 1:
        state.responses.name = userText;
        state.step = 2;
        sendMessage(chatId, '?? *2??/16: ������ ��� ����?* _����� �����._', 'Markdown');
        break;
      case 2:
        state.responses.age = userText;
        state.step = 3;
        sendMessage(chatId, '?? *3??/16: � ����� ��� / ���� �����?* _���������, ���, ������._', 'Markdown');
        break;
      case 3:
        state.responses.city = userText;
        state.responses.telegram = `@${message.from?.username || '����'}`;
        state.step = 4;
        sendMessage(chatId, '?? *4??/16: � ��� ���� �������?* _���������, IT, ���������._', 'Markdown');
        break;
      case 4:
        state.responses.profession = userText;
        state.step = 5;
        sendMessageWithButtons(chatId, '?? *5??/16: �� ��� ������ LinkedIn ������ �� 1 ��?*', [['? ���'], ['? ͳ']], 'Markdown');
        break;
      case 5:
        state.responses.ageOfAcc = userText;
        state.step = 6;
        sendMessageWithButtons(chatId, '?? *6??/16: �� ���������� ������ �� ������ ��������?*', [['? ���'], ['? ͳ']], 'Markdown');
        break;
      case 6:
        state.responses.phoneLinked = userText;
        state.step = 7;
        sendMessageWithButtons(chatId, '?? *7??/16: �� ������ ������ ������ ��� (���, ����, �����)?*', [['? ���'], ['? ͳ']], 'Markdown');
        break;
      case 7:
        state.responses.realData = userText;
        state.step = 8;
        sendMessageWithButtons(chatId, '?? *8??/16: �� ������� ������ �����-����������� ��� ������?*', [['? ���'], ['? ͳ']], 'Markdown');
        break;
      case 8:
        state.responses.selfie = userText;
        state.step = 9;
        sendMessageWithButtons(chatId, '?? *9??/16: �� ��� �������� ��� ������������ ����� (������� ��� ��������)?*', [['? ���'], ['? ͳ']], 'Markdown');
        break;
      case 9:
        state.responses.doc = userText;
        state.step = 10;
        sendMessageWithButtons(chatId, '?? *??/16: �� ������ ��������?* _����� ����._', [['? ���'], ['? ͳ']], 'Markdown');
        break;
      case 10:
        state.responses.active = userText;
        state.step = 11;
        sendMessageWithButtons(chatId, '?? *1??1??/16: �� ���� ������� ���������� ��� ������ � LinkedIn?*', [['? ���'], ['? ͳ']], 'Markdown');
        break;
      case 11:
        state.responses.blocked = userText;
        state.step = 12;
        sendMessageWithButtons(chatId, '? *1??2??/16: �� ���� ����� ������� ����� ������?*', [['?? �� 1 ��'], ['?? 1�3 ��'], ['? 3+ ��'], ['?? �������']], 'Markdown');
        break;
      case 12:
        state.responses.duration = userText;
        state.step = 13;
        sendMessage(chatId, '? *1??3??/16: �� ������ ������ ������ ������ �� �������?* _���������, �����, ������._', 'Markdown');
        break;
      case 13:
        state.responses.ready = userText;
        state.step = 14;
        sendMessageWithButtons(chatId, '?? *1??4??/16: �� ��� �� �������, �� ����� �����?*', [['? ���'], ['? ͳ']], 'Markdown');
        break;
      case 14:
        state.responses.otherAccounts = userText;
        state.step = 15;
        sendMessage(chatId, '?? *1??5??/16: ���������� �������� / �������?* _����� ����������._', 'Markdown');
        break;
      case 15:
        state.responses.comment = userText;
        state.responses.timestamp = new Date().toLocaleString();
        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: `${SHEET_NAME}!A:Z`,
          valueInputOption: 'RAW',
          resource: { values: [[
            state.responses.timestamp,
            state.responses.name,
            state.responses.age,
            state.responses.city,
            state.responses.telegram,
            state.responses.profession,
            state.responses.ageOfAcc,
            state.responses.phoneLinked,
            state.responses.realData,
            state.responses.selfie,
            state.responses.doc,
            state.responses.active,
            state.responses.blocked,
            state.responses.duration,
            state.responses.ready,
            state.responses.otherAccounts,
            state.responses.comment
          ]] },
        });
        state.messageIds.forEach(msgId => sendDeleteMessage(chatId, msgId));
        sendMessageWithButtons(chatId,
          '?? *������ �� ���������� ������!*\n' +
          `?? ��� �� ���������� ������ ���������, �������� �� ��� �����: [ϳ���������](${CHANNEL_URL})\n` +
          '_������� ������ �����!_',
          [['? ϳ���������']], 'Markdown');
        delete chatStates[chatId];
        break;
    }

    if (state.step > 0 && state.step < 15) {
      state.step++;
      if (messageId > 0) state.messageIds.push(messageId);
    }

    return res.json({ status: 'ok' });
  } catch (error) {
    console.error('Error: ' + error.toString());
    return res.json({ status: 'error', message: error.toString() });
  }
});

function sendMessage(chatId, text, parseMode = 'Markdown') {
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: parseMode,
  };
  https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
    res.on('data', () => {});
  }).end(JSON.stringify(payload));
}

function sendMessageWithButtons(chatId, text, buttons, parseMode = 'Markdown') {
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: parseMode,
    reply_markup: { keyboard: [buttons], one_time_keyboard: true, resize_keyboard: true },
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