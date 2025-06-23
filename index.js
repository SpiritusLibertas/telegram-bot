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

// Налаштування Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: 'твій_client_email', // Заміни на email із JSON-ключа
    private_key: 'твій_private_key'.replace(/\\n/g, '\n'), // Заміни на ключ із JSON
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

// Зберігання стану в пам’яті (замість PropertiesService)
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

    // Перший вхід або скидання стану
    if (state.step === 0 && !userText) {
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
      return res.json({ status: 'ok', message: 'Welcome sent' });
    }

    // Обробка крока 0 (вітальне повідомлення)
    if (state.step === 0 && userText === 'Продовжити') {
      state.step = 1;
      sendMessage(chatId, '?? *1??/16: Як тебе звати?* _Введи ім’я та прізвище._', 'Markdown');
      return res.json({ status: 'ok' });
    }

    // Логіка для інших кроків
    switch (state.step) {
      case 1:
        state.responses.name = userText;
        state.step = 2;
        sendMessage(chatId, '?? *2??/16: Скільки тобі років?* _Введи число._', 'Markdown');
        break;
      case 2:
        state.responses.age = userText;
        state.step = 3;
        sendMessage(chatId, '?? *3??/16: У якому місті / країні живеш?* _Наприклад, Київ, Україна._', 'Markdown');
        break;
      case 3:
        state.responses.city = userText;
        state.responses.telegram = `@${message.from?.username || 'немає'}`;
        state.step = 4;
        sendMessage(chatId, '?? *4??/16: У якій сфері працюєш?* _Наприклад, IT, маркетинг._', 'Markdown');
        break;
      case 4:
        state.responses.profession = userText;
        state.step = 5;
        sendMessageWithButtons(chatId, '?? *5??/16: Чи маєш акаунт LinkedIn старше за 1 рік?*', [['? Так'], ['? Ні']], 'Markdown');
        break;
      case 5:
        state.responses.ageOfAcc = userText;
        state.step = 6;
        sendMessageWithButtons(chatId, '?? *6??/16: Чи прив’язаний акаунт до номера телефону?*', [['? Так'], ['? Ні']], 'Markdown');
        break;
      case 6:
        state.responses.phoneLinked = userText;
        state.step = 7;
        sendMessageWithButtons(chatId, '?? *7??/16: Чи акаунт містить реальні дані (ім’я, фото, досвід)?*', [['? Так'], ['? Ні']], 'Markdown');
        break;
      case 7:
        state.responses.realData = userText;
        state.step = 8;
        sendMessageWithButtons(chatId, '?? *8??/16: Чи готовий пройти селфі-верифікацію при потребі?*', [['? Так'], ['? Ні']], 'Markdown');
        break;
      case 8:
        state.responses.selfie = userText;
        state.step = 9;
        sendMessageWithButtons(chatId, '?? *9??/16: Чи маєш документ для підтвердження особи (паспорт або водійське)?*', [['? Так'], ['? Ні']], 'Markdown');
        break;
      case 9:
        state.responses.doc = userText;
        state.step = 10;
        sendMessageWithButtons(chatId, '?? *??/16: Чи акаунт активний?* _Навіть рідко._', [['? Так'], ['? Ні']], 'Markdown');
        break;
      case 10:
        state.responses.active = userText;
        state.step = 11;
        sendMessageWithButtons(chatId, '?? *1??1??/16: Чи були випадки блокування або підозри в LinkedIn?*', [['? Так'], ['? Ні']], 'Markdown');
        break;
      case 11:
        state.responses.blocked = userText;
        state.step = 12;
        sendMessageWithButtons(chatId, '? *1??2??/16: На який термін готовий здати акаунт?*', [['?? до 1 міс'], ['?? 1–3 міс'], ['? 3+ міс'], ['?? постійно']], 'Markdown');
        break;
      case 12:
        state.responses.duration = userText;
        state.step = 13;
        sendMessage(chatId, '? *1??3??/16: Як швидко зможеш надати доступ до акаунта?* _Наприклад, зараз, завтра._', 'Markdown');
        break;
      case 13:
        state.responses.ready = userText;
        state.step = 14;
        sendMessageWithButtons(chatId, '?? *1??4??/16: Чи маєш ще акаунти, які можна здати?*', [['? Так'], ['? Ні']], 'Markdown');
        break;
      case 14:
        state.responses.otherAccounts = userText;
        state.step = 15;
        sendMessage(chatId, '?? *1??5??/16: Додатковий коментар / питання?* _Можна пропустити._', 'Markdown');
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
          '?? *Дякуємо за заповнення анкети!*\n' +
          `?? Щоб не пропустити важливі оновлення, підпишись на наш канал: [Підписатися](${CHANNEL_URL})\n` +
          '_Натисни кнопку нижче!_',
          [['? Підписатися']], 'Markdown');
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