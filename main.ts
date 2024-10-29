import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import * as dotenv from 'dotenv';
dotenv.config();

const TelegramBot = require('node-telegram-bot-api');
const token: string = process.env.TELEGRAM_BOT_TOKEN || 'default_token';
const bot = new TelegramBot(token, { polling: true });

const userSessions = {};  // Stores user session states

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    // Initialize user session if not exist
    if (!userSessions[chatId]) {
        userSessions[chatId] = { isLoggedIn: false };
    }

    // Handle /start command separately
    if (msg.text && msg.text.toLowerCase() === "/start") {
        const welcomeMessage = 'Welcome to the Driver Assistant Bot. Please log in with your phone number.';
        const loginKeyboard = {
            reply_markup: {
                one_time_keyboard: true,
                keyboard: [[{ text: "Login with Phone Number", request_contact: true }]],
                resize_keyboard: true,
            }
        };
        bot.sendMessage(chatId, welcomeMessage, loginKeyboard);
        return; // Stop further processing in this event
    }

    if (msg.contact && msg.contact.phone_number) {
        const phoneNumber = msg.contact.phone_number.replace(/\D/g, '');
        console.log(`Received phone number: ${phoneNumber}`); // Log the cleaned phone number

        try {
            let driver = await prisma.drivers.findUnique({
                where: { phone_number: phoneNumber },
            });

            console.log(`Database lookup result for ${phoneNumber}:`, driver); // Log what the database returns

            if (driver) {
                userSessions[chatId] = { isLoggedIn: true, phoneNumber: phoneNumber }; // Update session state
                const locationKeyboard = {
                    reply_markup: {
                        one_time_keyboard: true,
                        keyboard: [[{ text: "Share Location", request_location: true }]],
                        resize_keyboard: true,
                    }
                };
                bot.sendMessage(chatId, `Welcome back, ${driver.name}! You are now logged in. Please share your location.`, locationKeyboard);
            } else {
                bot.sendMessage(chatId, 'You are not registered. Access denied.');
            }
        } catch (error) {
            console.error('Database access error:', error);
            bot.sendMessage(chatId, 'Error accessing the database.');
        }
    } else if (msg.location && userSessions[chatId].isLoggedIn) {
        console.log(`Updating location for user ${userSessions[chatId].phoneNumber}: ${msg.location.latitude}, ${msg.location.longitude}`);

        try {
            await prisma.drivers.update({
                where: { phone_number: userSessions[chatId].phoneNumber },
                data: {
                    latitude: msg.location.latitude,
                    longitude: msg.location.longitude
                }
            });
            bot.sendMessage(chatId, 'Location updated successfully.');
        } catch (error) {
            console.error('Error updating location:', error);
            bot.sendMessage(chatId, 'Failed to update location.');
        }
    } else {
        // Respond to any other text messages not recognized as commands
        if (msg.text) {
            const options = userSessions[chatId].isLoggedIn ? {
                reply_markup: {
                    one_time_keyboard: true,
                    keyboard: [[{ text: "Share Location", request_location: true }]],
                    resize_keyboard: true,
                }
            } : {
                reply_markup: {
                    one_time_keyboard: true,
                    keyboard: [[{ text: "Login with Phone Number", request_contact: true }]],
                    resize_keyboard: true,
                }
            };
            bot.sendMessage(chatId, "Currently I don't respond to text messages. Please select the appropriate command from the list below:", options);
        }
    }
});

