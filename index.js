const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const { google } = require('googleapis');
require('dotenv').config();

const TOKEN = '7591593436:AAEgOBitSVUCsvIWw7Y1rMTRXpeKupcJVVg';
const SHEET_NAME = 'Лист1';
const CHANNEL_URL = 'https://t.me/Rentlogin_click';
const SHEET_ID = '1IK-Vx0KI-D0tx_4If34YGOmBgocm9FNwtwoTNPPJtUs';

const app = express();
app.use(bodyParser.json());

const CLIENT_EMAIL = process.env.CLIENT_EMAIL || '';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
console.log('CLIENT_EMAIL:', CLIENT_EMAIL);
console.log('PRIVATE_KEY length:', PRIVATE_KEY.length);
const auth = new google.auth.GoogleAuth({
  credentials: { 
    client_email: CLIENT_EMAIL, 
    private_key: PRIVATE_KEY.replace(/\\n/g, '\n') 
  },
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
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid or missing message' 
      });
    }

    const chatId = message.chat?.id;
    const userText = message.text || '';
    const messageId = message.message_id || 0;

    console.log(`Processing - Chat ID: ${chatId}, Text: ${userText}, Message ID: ${messageId}`);

    if (!chatId) {
      console.log('Chat ID is undefined');
      return res.status(400).json({ 
        status: 'error', 
        message: 'Chat ID is undefined' 
      });
    }

    if (!chatStates[chatId]) {
      console.log(`Initializing state for Chat ID: ${chatId}`);
      chatStates[chatId] = { step: 0, responses: {}, messageIds: [] };
    }
    const state = chatStates[chatId];

    console.log(`Checking step: ${state.step}, userText: "${userText}"`);
    
    // Обробка команди /start
    if (state.step === 0 && userText === '/start') {
      console.log(`Step 0 triggered for ${chatId} with /start`);
      state.step = 0;
      state.responses = {};
      state.messageIds = [];
      
      const welcomeText = '🎉 Вітаємо в боті LRconverter!\n' +
        '👤 Цей бот збереже важливу інформацію для зручної та ефективної співпраці.\n' +
        '🔒 Не хвилюйся — усі запитання безпечні й не стосуються конфіденційних даних.\n' +
        '📝 Отримані відповіді потрібні лише для того, щоб краще організувати нашу взаємодію.\n' +
        'Натисни "Продовжити", щоб почати.';
      
      sendMessageWithButtons(chatId, welcomeText, [['✅ Продовжити']], 'Markdown');
      console.log(`Sent welcome message to ${chatId}`);
      return res.json({ status: 'ok', message: 'Welcome sent' });
    }

    // Обробка кнопки "Продовжити"
    if (state.step === 0 && (userText === '✅ Продовжити' || userText === 'Продовжити')) {
      console.log(`User clicked "Продовжити" on ${chatId}, moving to step 1`);
      state.step = 1;
      sendMessage(chatId, '👤 1️⃣/16: Як тебе звати? Введи імя та прізвище.', 'Markdown');
      console.log(`Sent step 1 message to ${chatId}`);
      return res.json({ status: 'ok' });
    }

    // Обробка кроків опитування
    switch (state.step) {
      case 1:
        state.responses.name = userText;
        state.step = 2;
        sendMessage(chatId, '🎂 2️⃣/16: Скільки тобі років? Введи число.', 'Markdown');
        console.log(`Moved to step 2 for ${chatId}`);
        break;
        
      case 2:
        state.responses.age = userText;
        state.step = 3;
        sendMessage(chatId, '📧 3️⃣/16: Який у тебе email? Введи адресу.', 'Markdown');
        console.log(`Moved to step 3 for ${chatId}`);
        break;
        
      case 3:
        state.responses.email = userText;
        state.step = 4;
        sendMessage(chatId, '📞 4️⃣/16: Який у тебе номер телефону? Введи в форматі +380XXXXXXXXX.', 'Markdown');
        console.log(`Moved to step 4 for ${chatId}`);
        break;
        
      case 4:
        state.responses.phone = userText;
        state.step = 5;
        sendMessage(chatId, '🏠 5️⃣/16: Де ти живеш? Введи місто або регіон.', 'Markdown');
        console.log(`Moved to step 5 for ${chatId}`);
        break;
        
      case 5:
        state.responses.location = userText;
        state.step = 6;
        sendMessage(chatId, '💼 6️⃣/16: Якою є твоя основна професія? Введи назву.', 'Markdown');
        console.log(`Moved to step 6 for ${chatId}`);
        break;
        
      case 6:
        state.responses.profession = userText;
        state.step = 7;
        sendMessage(chatId, '⏰ 7️⃣/16: Скільки годин на тиждень ти можеш працювати? Введи число.', 'Markdown');
        console.log(`Moved to step 7 for ${chatId}`);
        break;
        
      case 7:
        state.responses.workHours = userText;
        state.step = 8;
        sendMessage(chatId, '💰 8️⃣/16: Який твій бажаний рівень доходу? Введи суму в грн.', 'Markdown');
        console.log(`Moved to step 8 for ${chatId}`);
        break;
        
      case 8:
        state.responses.income = userText;
        state.step = 9;
        sendMessage(chatId, '🌐 9️⃣/16: Чи маєш ти досвід роботи онлайн? Так/Ні.', 'Markdown');
        console.log(`Moved to step 9 for ${chatId}`);
        break;
        
      case 9:
        state.responses.onlineExp = userText;
        state.step = 10;
        sendMessage(chatId, '💻 🔟/16: Які інструменти чи програми ти використовуєш? Введи список.', 'Markdown');
        console.log(`Moved to step 10 for ${chatId}`);
        break;
        
      case 10:
        state.responses.tools = userText;
        state.step = 11;
        sendMessage(chatId, '🎯 1️⃣1️⃣/16: Які твої сильні сторони? Введи 2-3 пункти.', 'Markdown');
        console.log(`Moved to step 11 for ${chatId}`);
        break;
        
      case 11:
        state.responses.strengths = userText;
        state.step = 12;
        sendMessage(chatId, '❓ 1️⃣2️⃣/16: Чи є у тебе досвід роботи в команді? Так/Ні, опиши.', 'Markdown');
        console.log(`Moved to step 12 for ${chatId}`);
        break;
        
      case 12:
        state.responses.teamExp = userText;
        state.step = 13;
        sendMessage(chatId, '📅 1️⃣3️⃣/16: Який твій графік доступності? Введи дні чи години.', 'Markdown');
        console.log(`Moved to step 13 for ${chatId}`);
        break;
        
      case 13:
        state.responses.schedule = userText;
        state.step = 14;
        sendMessage(chatId, '🌟 1️⃣4️⃣/16: Чи є у тебе портфоліо чи приклади робіт? Так/Ні, додай посилання.', 'Markdown');
        console.log(`Moved to step 14 for ${chatId}`);
        break;
        
      case 14:
        state.responses.portfolio = userText;
        state.step = 15;
        sendMessage(chatId, '🤝 1️⃣5️⃣/16: Чи згоден ти з умовами співпраці? Так/Ні.', 'Markdown');
        console.log(`Moved to step 15 for ${chatId}`);
        break;
        
      case 15:
        state.responses.agreement = userText;
        state.step = 16;
        
        // Збереження в Google Sheets
        try {
          await saveToGoogleSheets(state.responses, chatId);
          sendMessage(chatId, '✅ 1️⃣6️⃣/16: Дякую! Дані успішно збережено. Очікуй на зворотний звязок.', 'Markdown');
        } catch (sheetError) {
          console.error('Error saving to Google Sheets:', sheetError);
          sendMessage(chatId, '✅ 1️⃣6️⃣/16: Дякую! Дані отримано, але виникла помилка при збереженні. Звяжемося з тобою найближчим часом.', 'Markdown');
        }
        
        console.log(`Completed survey for ${chatId}`);
        // Очищаємо стан після завершення
        delete chatStates[chatId];
        break;
    }

    if (state.step > 0 && state.step < 15) {
      if (messageId > 0) state.messageIds.push(messageId);
    }

    return res.json({ status: 'ok' });
  } catch (error) {
    console.error('Error:', error.toString());
    return res.status(500).json({ status: 'error', message: error.toString() });
  }
});

// Функція для збереження в Google Sheets
async function saveToGoogleSheets(responses, chatId) {
  try {
    const values = [
      [
        new Date().toISOString(),
        chatId,
        responses.name || '',
        responses.age || '',
        responses.email || '',
        responses.phone || '',
        responses.location || '',
        responses.profession || '',
        responses.workHours || '',
        responses.income || '',
        responses.onlineExp || '',
        responses.tools || '',
        responses.strengths || '',
        responses.teamExp || '',
        responses.schedule || '',
        responses.portfolio || '',
        responses.agreement || ''
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:Q`,
      valueInputOption: 'RAW',
      requestBody: { values }
    });

    console.log(`Data saved to Google Sheets for chat ${chatId}`);
  } catch (error) {
    console.error('Google Sheets error:', error);
    throw error;
  }
}

function sendMessage(chatId, text, parseMode = 'Markdown') {
  console.log(`Sending message to ${chatId}: ${text}`);
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const payload = { 
    chat_id: chatId, 
    text, 
    parse_mode: parseMode 
  };
  
  const req = https.request(url, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' } 
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => console.log(`Response from Telegram: ${data}`));
  });
  
  req.on('error', (err) => console.error(`Telegram error: ${err.message}`));
  req.end(JSON.stringify(payload));
}

function sendMessageWithButtons(chatId, text, buttons, parseMode = 'Markdown') {
  console.log(`Sending message with buttons to ${chatId}: ${text}`);
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: parseMode,
    reply_markup: {
      keyboard: buttons,
      one_time_keyboard: true,
      resize_keyboard: true,
    },
  };
  
  const req = https.request(url, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' } 
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => console.log(`Response from Telegram: ${data}`));
  });
  
  req.on('error', (err) => console.error(`Telegram error: ${err.message}`));
  req.end(JSON.stringify(payload));
}

function sendDeleteMessage(chatId, messageId) {
  console.log(`Deleting message ${messageId} from ${chatId}`);
  const url = `https://api.telegram.org/bot${TOKEN}/deleteMessage`;
  
  const req = https.request(url, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' } 
  }, (res) => {
    res.on('data', () => {});
  });
  
  req.on('error', (err) => console.error(`Delete message error: ${err.message}`));
  req.end(JSON.stringify({ chat_id: chatId, message_id: messageId }));
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));