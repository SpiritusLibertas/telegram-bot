const express = require('express');
const bodyParser = require('body-parser');
const TOKEN = '7591593436:AAEgOBitSVUCsvIWw7Y1rMTRXpeKupcJVVg'; // Твій токен
const CHANNEL_URL = 'https://t.me/Rentlogin_click';

const app = express();
app.use(bodyParser.json());

app.post('/', (req, res) => {
  const { message } = req.body;
  const chatId = message?.chat?.id;
  const userText = message?.text || '';

  if (!chatId) {
    res.json({ status: 'error', message: 'Chat ID is undefined' });
    return;
  }

  console.log(`Chat ID: ${chatId}, Text: ${userText}`);

  if (!userText) {
    sendMessage(chatId, '🎉 *Вітаємо в боті LRconverter!*\n_Натисни "Продовжити", щоб почати._', [['✅ Продовжити']]);
    res.json({ status: 'ok', message: 'Welcome sent' });
    return;
  }

  res.json({ status: 'ok', message: 'Processed' });
});

function sendMessage(chatId, text, buttons) {
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown',
    reply_markup: { keyboard: buttons, one_time_keyboard: true, resize_keyboard: true },
  };
  require('https').request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
    res.on('data', () => {});
  }).end(JSON.stringify(payload));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));