const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');
const fs = require('fs');
const { TiktokDL } = require("@tobyg74/tiktok-api-dl");

const botToken = '6739576468:AAGffK_kgGCwdx8K5xF4Kdi9zMEFRI3qxMo';
const downloadPath = `${__dirname}/download`;

// Проверяем, существует ли каталог download, и если нет, создаем его
fs.existsSync(downloadPath) || fs.mkdirSync(downloadPath);

// Используем актуальную версию node-telegram-bot-api
const bot = new TelegramBot(botToken, { polling: true });

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (msg.text === '/start') {
    bot.sendMessage(chatId, 'Привет! Я бот загрузки тикток видео в ВК. Просто отправь мне ссылку на тикток видео, и я загружу его в указанную директорию.');
  } else if (isTikTokUrl(msg.text)) {
    try {
      await downloadAndSendVideo(msg.text, chatId);
    } catch (error) {
      handleError(chatId, error);
    }
  } else {
    bot.sendMessage(chatId, 'Пожалуйста, отправь мне ссылку на тикток видео.');
  }
});

async function downloadAndSendVideo(tiktokUrl, chatId) {
  try {
    const result = await TiktokDL(tiktokUrl, { version: "v1" });

    validateTikTokApiResponse(result);

    const { author, id, description, video } = result.result;
    const authorUsername = author.username;
    const videoUrl = video[0];

    validateVideoData(authorUsername, id, videoUrl);

    const filePath = saveVideoToFile(videoUrl);

    sendVideoToUser(chatId, authorUsername, id, description, filePath);
  } catch (error) {
    handleError(chatId, error);
  }
}

// Остальной код...

function validateTikTokApiResponse(result) {
  if (!result || !result.result || !result.result.author) {
    throw new Error('Некорректный формат ответа от TikTok API');
  }
}

function validateVideoData(authorUsername, id, videoUrl) {
  if (!authorUsername || !id || !videoUrl) {
    throw new Error('Отсутствуют необходимые данные в ответе от TikTok API');
  }
}

function saveVideoToFile(videoUrl) {
  const fileName = generateFileName();
  const filePath = `${downloadPath}/${fileName}.mp4`;
  downloadVideo(videoUrl, filePath);
  console.log('Сохранение файла по пути:', filePath);
  return filePath;
}

function sendVideoToUser(chatId, authorUsername, id, description, filePath) {
  bot.sendMessage(chatId, `Видео успешно загружено!\nАвтор: ${authorUsername}\nID: ${id}\nОписание: ${description}`);

  bot.sendVideo(chatId, fs.createReadStream(filePath), { caption: `Видео от ${authorUsername}` })
    .then(() => deleteVideo(filePath))
    .catch((sendError) => {
      console.error('Ошибка при отправке видео:', sendError);
      deleteVideo(filePath);
    });
}

function handleError(chatId, error) {
  const errorMessage = `Произошла ошибка: ${error.message}`;
  bot.sendMessage(chatId, errorMessage);
  console.error(errorMessage);
}

// Остальной код...
