// telegram bot

import * as dotenv from 'dotenv';
dotenv.config();

const TelegramBot = require('node-telegram-bot-api');

// Replace the value below with the Telegram token you received from BotFather

const token: string = process.env.TELEGRAM_BOT_TOKEN || 'default_token';

// const token = '7214251084:AAHt8Z-q2XVOWWu1pA1n4SQY8UfyYM4jIbg';

// Create a bot that uses polling to fetch new updates
const bot = new TelegramBot(token, {polling: true});

// Listen for any kind of message
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    // If the user sends a location (latitude and longitude), respond back
    if (msg.location) {
        console.log('Location received:', msg.location);
        bot.sendMessage(chatId, `Location received: ${msg.location.latitude}, ${msg.location.longitude}`);
    } else {
        // Send a custom keyboard to request location sharing
        const options = {
            reply_markup: JSON.stringify({
                keyboard: [
                    [{text: "Share Location", request_location: true}],
                ],
                resize_keyboard: true,
                one_time_keyboard: true,
            }),
        };
        bot.sendMessage(chatId, 'Press the button to share your location.', options);
    }
});





