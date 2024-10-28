import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import * as dotenv from 'dotenv';
dotenv.config();

const TelegramBot = require('node-telegram-bot-api');
const token: string = process.env.TELEGRAM_BOT_TOKEN || 'default_token';
const bot = new TelegramBot(token, { polling: true });

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    if (msg.location) {
        console.log('Location received:', msg.location);
        const latitude = msg.location.latitude;
        const longitude = msg.location.longitude;
        const createdAt = new Date(); // Capture the current timestamp

        // Create a unique ID combining chatId and timestamp
        const uniqueId = `${chatId}_${createdAt.getTime()}`;

        try {
            const location = await prisma.location.create({
                data: {
                    id: uniqueId,
                    chatId: chatId,
                    latitude: latitude,
                    longitude: longitude,
                    createdAt: createdAt
                }
            });
            console.log('Saved location:', location);
            bot.sendMessage(chatId, `Location saved: ${latitude}, ${longitude}`);
        } catch (error) {
            console.error('Error saving location:', error);
            bot.sendMessage(chatId, 'Failed to save location.');
        }
    } else {
        const options = {
            reply_markup: JSON.stringify({
                keyboard: [
                    [{ text: "Share Location", request_location: true }],
                ],
                resize_keyboard: true,
                one_time_keyboard: true,
            }),
        };
        bot.sendMessage(chatId, 'Press the button to share your location.', options);
    }
});
