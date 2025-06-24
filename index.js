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
    const username = message.from?.username || '';
    const telegramName = `${message.from?.first_name || ''} ${message.from?.last_name || ''}`.trim();

    console.log(`Processing - Chat ID: ${chatId}, Text: ${userText}, Message ID: ${messageId}, Username: @${username}`);

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

    // Додаємо юзернейм та ім'я з Telegram до відповідей
    state.responses.telegramUsername = username;
    state.responses.telegramName = telegramName;

    console.log(`Checking step: ${state.step}, userText: "${userText}"`);
    
    // Обробка команди /start
    if (state.step === 0 && userText === '/start') {
      console.log(`Step 0 triggered for ${chatId} with /start`);
      state.step = 0;
      state.responses = {
        telegramUsername: username,
        telegramName: telegramName
      };
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
    if (state.step === 0 && userText === '✅ Продовжити') {
      console.log(`User clicked "Продовжити" on ${chatId}, moving to step 1`);
      state.step = 1;
      sendMessage(chatId, '👤 1️⃣/16: Як тебе звати? Введи ім'я та прізвище.', 'Markdown');
      console.log(`Sent step 1 message to ${chatId}`);
      return res.json({ status: 'ok' });
    }

    // Зберігаємо ID всіх повідомлень для подальшого видалення
    if (messageId > 0 && state.step > 0) {
      state.messageIds.push(messageId);
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
        sendMessage(chatId, '🏠 3️⃣/16: У якому місті / країні живеш? Наприклад, Київ, Україна.', 'Markdown');
        console.log(`Moved to step 3 for ${chatId}`);
        break;
        
      case 3:
        state.responses.location = userText;
        state.step = 4;
        sendMessage(chatId, '💼 4️⃣/16: У якій сфері працюєш? Наприклад, IT, маркетинг.', 'Markdown');
        console.log(`Moved to step 4 for ${chatId}`);
        break;
        
      case 4:
        state.responses.profession = userText;
        state.step = 5;
        sendMessageWithButtons(chatId, '🔗 5️⃣/16: Чи маєш акаунт LinkedIn старше за 1 рік?', [['✅ Так'], ['❌ Ні']], 'Markdown');
        console.log(`Moved to step 5 for ${chatId}`);
        break;
        
      case 5:
        state.responses.accountAge = userText;
        state.step = 6;
        sendMessageWithButtons(chatId, '📱 6️⃣/16: Чи прив'язаний акаунт до номера телефону?', [['✅ Так'], ['❌ Ні']], 'Markdown');
        console.log(`Moved to step 6 for ${chatId}`);
        break;
        
      case 6:
        state.responses.phoneLinked = userText;
        state.step = 7;
        sendMessageWithButtons(chatId, '🧑‍💼 7️⃣/16: Чи акаунт містить реальні дані (ім'я, фото, досвід)?', [['✅ Так'], ['❌ Ні']], 'Markdown');
        console.log(`Moved to step 7 for ${chatId}`);
        break;
        
      case 7:
        state.responses.realData = userText;
        state.step = 8;
        sendMessageWithButtons(chatId, '📸 8️⃣/16: Чи готовий пройти селфі-верифікацію при потребі?', [['✅ Так'], ['❌ Ні']], 'Markdown');
        console.log(`Moved to step 8 for ${chatId}`);
        break;
        
      case 8:
        state.responses.selfieReady = userText;
        state.step = 9;
        sendMessageWithButtons(chatId, '🪪 9️⃣/16: Чи маєш документ для підтвердження особи (паспорт або водійське)?', [['✅ Так'], ['❌ Ні']], 'Markdown');
        console.log(`Moved to step 9 for ${chatId}`);
        break;
        
      case 9:
        state.responses.document = userText;
        state.step = 10;
        sendMessageWithButtons(chatId, '⏳ 1️⃣0️⃣/16: Чи акаунт активний? Навіть рідко.', [['✅ Так'], ['❌ Ні']], 'Markdown');
        console.log(`Moved to step 10 for ${chatId}`);
        break;
        
      case 10:
        state.responses.active = userText;
        state.step = 11;
        sendMessageWithButtons(chatId, '⚠️ 1️⃣1️⃣/16: Чи були випадки блокування або підозри в LinkedIn?', [['✅ Так'], ['❌ Ні']], 'Markdown');
        console.log(`Moved to step 11 for ${chatId}`);
        break;
        
      case 11:
        state.responses.blockHistory = userText;
        state.step = 12;
        sendMessageWithButtons(chatId, '📅 1️⃣2️⃣/16: На який термін готовий здати акаунт?', [['до 1 міс'], ['1–3 міс'], ['3+ міс'], ['постійно']], 'Markdown');
        console.log(`Moved to step 12 for ${chatId}`);
        break;
        
      case 12:
        state.responses.duration = userText;
        state.step = 13;
        sendMessage(chatId, '⏱️ 1️⃣3️⃣/16: Як швидко зможеш надати доступ до акаунта? Наприклад, зараз, завтра.', 'Markdown');
        console.log(`Moved to step 13 for ${chatId}`);
        break;
        
      case 13:
        state.responses.accessSpeed = userText;
        state.step = 14;
        sendMessageWithButtons(chatId, '➕ 1️⃣4️⃣/16: Чи маєш ще акаунти, які можна здати?', [['✅ Так'], ['❌ Ні']], 'Markdown');
        console.log(`Moved to step 14 for ${chatId}`);
        break;
        
      case 14:
        state.responses.extraAccounts = userText;
        state.step = 15;
        sendMessage(chatId, '💬 1️⃣5️⃣/16: Додатковий коментар / питання? Можна пропустити.', 'Markdown');
        console.log(`Moved to step 15 for ${chatId}`);
        break;
        
      case 15:
        state.responses.comment = userText;
        state.step = 16;
        
        // Збереження в Google Sheets
        try {
          await saveToGoogleSheets(state.responses, chatId);
          
          // Видалення всіх попередніх повідомлень
          for (const msgId of state.messageIds) {
            await sendDeleteMessage(chatId, msgId);
            // Невелика затримка між видаленнями
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          // Видалення останнього повідомлення користувача
          await sendDeleteMessage(chatId, messageId);
          
          // Надсилання фінального повідомлення з видаленням клавіатури
          const finalMessage = `✅ 1️⃣6️⃣/16: Дякую! Дані успішно збережено. Приєднуйся до каналу: [тут](${CHANNEL_URL})`;
          sendMessage(chatId, finalMessage, 'Markdown', { remove_keyboard: true });
          
          console.log(`Completed survey and cleared chat history for ${chatId}`);
        } catch (sheetError) {
          console.error('Error saving to Google Sheets:', sheetError);
          sendMessage(chatId, '✅ 1️⃣6️⃣/16: Дякую! Дані отримано, але виникла помилка при збереженні. Звяжемося з тобою найближчим часом.', 'Markdown', { remove_keyboard: true });
        }
        
        // Очищаємо стан після завершення
        delete chatStates[chatId];
        break;
    }

    return res.json({ status: 'ok' });
  } catch (error) {
    console.error('Error:', error.toString());
    return res.status(500).json({ status: 'error', message: error.toString() });
  }
});

// Функція для збереження в Google Sheets з правильним порядком колонок
async function saveToGoogleSheets(responses, chatId) {
  try {
    const values = [
      [
        new Date().toISOString(), // A - Timestamp
        responses.name || '', // B - Ім'я
        responses.age || '', // C - Вік
        responses.location || '', // D - Місто
        responses.telegramUsername ? `@${responses.telegramUsername}` : '', // E - Telegram
        responses.profession || '', // F - Професія
        responses.accountAge || '', // G - Стаж акаунту
        responses.phoneLinked || '', // H - Прив'язка до номера
        responses.realData || '', // I - Реальні дані
        responses.selfieReady || '', // J - Готовність до селфі
        responses.document || '', // K - Документ
        responses.active || '', // L - Активність
        responses.blockHistory || '', // M - Історія блокувань
        responses.duration || '', // N - Термін
        responses.accessSpeed || '', // O - Готовність здати
        responses.extraAccounts || '', // P - Інші акаунти
        responses.comment || '' // Q - Коментар
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

function sendMessage(chatId, text, parseMode = 'Markdown', replyMarkup = {}) {
  console.log(`Sending message to ${chatId}: ${text}`);
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const payload = { 
    chat_id: chatId, 
    text, 
    parse_mode: parseMode,
    reply_markup: replyMarkup
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
  return new Promise((resolve, reject) => {
    console.log(`Deleting message ${messageId} from ${chatId}`);
    const url = `https://api.telegram.org/bot${TOKEN}/deleteMessage`;
    
    const req = https.request(url, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' } 
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`Delete response: ${data}`);
        resolve(data);
      });
    });
    
    req.on('error', (err) => {
      console.error(`Delete message error: ${err.message}`);
      reject(err);
    });
    
    req.end(JSON.stringify({ chat_id: chatId, message_id: messageId }));
  });
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));