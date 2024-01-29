const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');
const fs = require('fs');
const { TiktokDL } = require("@tobyg74/tiktok-api-dl");

const botToken = '6739576468:AAGffK_kgGCwdx8K5xF4Kdi9zMEFRI3qxMo';
const downloadPath = `${__dirname}/download`;
const adminId = 1305218647;
const vkGroupId = -224422023; // Укажите ID вашей группы ВК

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
      const filePath = await downloadAndSendVideo(msg.text, chatId);
      if (filePath) {
        // После успешной загрузки предлагаем отправить видео в группу ВК
        offerToSendToVKGroup(chatId, filePath);
      }
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

    return filePath; // Возвращаем путь к сохраненному видео
  } catch (error) {
    handleError(chatId, error);
    return null;
  }
}

function offerToSendToVKGroup(chatId, filePath) {
  bot.sendMessage(chatId, 'Хотите отправить видео в группу ВК?')
    .then(() => {
      // Создаем кнопки для ответа
      const keyboard = {
        inline_keyboard: [
          [
            { text: 'Да', callback_data: 'publishNow' },
            { text: 'Опубликовать в определенное время', callback_data: 'publishLater' },
            { text: 'Отклонить', callback_data: 'reject' },
          ],
        ],
      };

      bot.sendMessage(chatId, 'Выберите действие:', { reply_markup: keyboard });
    })
    .then(() => {
      // Сохраняем путь к файлу в контексте чата для последующего использования
      bot.setChat(chatId, { videoFilePath: filePath });
    })
    .catch((error) => {
      console.error('Ошибка при отправке предложения в группу ВК:', error);
    });
}

bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const fileId = bot.getChat(chatId).videoFilePath;

  if (!fileId) {
    bot.sendMessage(chatId, 'Ошибка: Файл не найден. Попробуйте загрузить видео заново.');
    return;
  }

  switch (callbackQuery.data) {
    case 'publishNow':
      publishVideoToVKGroup(fileId);
      break;
    case 'publishLater':
      // Добавьте код для определения времени публикации в UNIX-формате
      bot.sendMessage(chatId, 'Выберите время для публикации в UNIX-формате.');
      break;
    case 'reject':
      bot.sendMessage(chatId, 'Видео не будет отправлено в группу ВК.');
      break;
    default:
      break;
  }
});

function publishVideoToVKGroup(filePath) {
  // Добавьте код для отправки видео в группу ВК
  // Используйте vk token и groupId, указанные в начале кода
  // Пример запроса к VK API: https://vk.com/dev/video.save
  // После успешной публикации, удалите видео
  // deleteVideo(filePath);
}

// Остальной код...

