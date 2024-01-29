const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');
const fs = require('fs');
const { TiktokDL } = require("@tobyg74/tiktok-api-dl");

const botToken = '6739576468:AAGffK_kgGCwdx8K5xF4Kdi9zMEFRI3qxMo';
const downloadPath = '/';

const bot = new TelegramBot(botToken, { polling: true });

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (msg.text === '/start') {
    bot.sendMessage(chatId, 'Привет! Я бот загрузки тикток видео в ВК. Просто отправь мне ссылку на тикток видео, и я загружу его в указанную директорию.');
  } else if (msg.text.startsWith('https://www.tiktok.com/')) {
    try {
      await downloadAndSendVideo(msg.text, chatId);
    } catch (error) {
      bot.sendMessage(chatId, `Произошла ошибка: ${error.message}`);
    }
  } else {
    bot.sendMessage(chatId, 'Пожалуйста, отправь мне ссылку на тикток видео.');
  }
});

async function downloadAndSendVideo(tiktokUrl, chatId) {
  const result = await TiktokDL(tiktokUrl, { version: "v1" });
  const authorUsername = result.result.author.username;
  const id = result.result.id;
  const description = result.result.description;
  const videoUrl = result.result.video[0];

  const fileName = generateFileName();
  const filePath = `${downloadPath}/${fileName}.mp4`;

  // Save video to file
  await downloadVideo(videoUrl, filePath);

  // Send message with details
  bot.sendMessage(chatId, `Видео успешно загружено!\nАвтор: ${authorUsername}\nID: ${id}\nОписание: ${description}`);

  // Send video to user
  bot.sendVideo(chatId, filePath, { caption: `Видео от ${authorUsername}` });

  // Delete video after sending
  deleteVideo(filePath);
}

async function downloadVideo(url, path) {
  const response = await fetch(url);
  const buffer = await response.buffer();
  fs.writeFileSync(path, buffer);
}

function deleteVideo(path) {
  // Delete the file
  fs.unlinkSync(path);
}

function generateFileName() {
  const date = new Date();
  return `${date.getFullYear()}_${date.getMonth() + 1}_${date.getDate()}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}`;
}
