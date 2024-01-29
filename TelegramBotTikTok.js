const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');
const fs = require('fs');
const { TiktokDL } = require("@tobyg74/tiktok-api-dl");

const botToken = '6739576468:AAGffK_kgGCwdx8K5xF4Kdi9zMEFRI3qxMo';
const downloadPath = `${__dirname}/download`;

// Проверяем, существует ли каталог download, и если нет, создаем его
if (!fs.existsSync(downloadPath)) {
  fs.mkdirSync(downloadPath);
}

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
      bot.sendMessage(chatId, `Произошла ошибка: ${error.message}`);
    }
  } else {
    bot.sendMessage(chatId, 'Пожалуйста, отправь мне ссылку на тикток видео.');
  }
});

async function downloadAndSendVideo(tiktokUrl, chatId) {
  try {
    const result = await TiktokDL(tiktokUrl, { version: "v1" });

    console.log('Ответ от TikTok API:', result);
    console.log('Статус ответа от TikTok API:', result.status);

    if (!result || !result.result || !result.result.author) {
      throw new Error('Некорректный формат ответа от TikTok API');
    }

    const authorUsername = result.result.author.username;
    const id = result.result.id;
    const description = result.result.description;
    const videoUrl = result.result.video[0];

    if (!authorUsername || !id || !description || !videoUrl) {
      throw new Error('Отсутствуют необходимые данные в ответе от TikTok API');
    }

    const fileName = generateFileName();
    const filePath = `${downloadPath}/${fileName}.mp4`;

    // Save video to file
    await downloadVideo(videoUrl, filePath);
    console.log('Сохранение файла по пути:', filePath);

    // Send message with details
    bot.sendMessage(chatId, `Видео успешно загружено!\nАвтор: ${authorUsername}\nID: ${id}\nОписание: ${description}`);

    // Send video to user
    bot.sendVideo(chatId, fs.createReadStream(filePath), { caption: `Видео от ${authorUsername}` })
      .then(() => {
        // Delete video after sending
        deleteVideo(filePath);
      })
      .catch((sendError) => {
        console.error('Ошибка при отправке видео:', sendError);
        // If there's an error sending, still try to delete the video
        deleteVideo(filePath);
      });
  } catch (error) {
    const errorMessage = `Произошла ошибка: ${error.message}`;
    bot.sendMessage(chatId, errorMessage);
    console.error(errorMessage);
  }
}


// Остальной код...

function downloadVideo(url, path) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(path);
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to download video: ${response.statusText}`);
        }
        response.body.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      })
      .catch(error => {
        reject(error);
      });
  });
}

function deleteVideo(path) {
  fs.unlinkSync(path);
}

function generateFileName() {
  const date = new Date();
  return `${date.getFullYear()}_${date.getMonth() + 1}_${date.getDate()}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}`;
}

function isTikTokUrl(url) {
  return /^https:\/\/(www\.)?tiktok\.com\//.test(url) || /^https:\/\/vm\.tiktok\.com\//.test(url);
}
