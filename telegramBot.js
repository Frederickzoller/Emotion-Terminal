// Import the required libraries
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');
const fetch = require('node-fetch');
const fs = require('fs');

// Make fetch available globally
global.fetch = fetch;

// Bot token
const BOT_TOKEN = '7882372069:AAH_zphFOKq081hKD2sp6wNI-w-EPY8eKWU';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: 'glhf_4c6e244a95664a44791cfc532efa96e6',
    baseURL: 'https://glhf.chat/api/openai/v1',
});

// Create bot instance
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Configuration
const CONFIG = {
    username: 'sentinenttrumpbot',
    minPostLength: 40,
    maxPostLength: 200  // Increased for better responses
};

// Import prompts
const { SYSTEM_PROMPTS } = require('./prompts');

// Load length formats
const lengthFormats = JSON.parse(fs.readFileSync('./length_formats.json', 'utf8'));

// Create a Map to store conversation history
const userConversations = new Map();

// Maximum number of messages to remember per user
const MAX_MEMORY = 4;

// Function to add message to user's conversation history
function addToConversationHistory(userId, message, isBot) {
    if (!userConversations.has(userId)) {
        userConversations.set(userId, []);
    }

    const history = userConversations.get(userId);
    history.push({
        content: message,
        isBot: isBot,
        timestamp: Date.now()
    });

    // Keep only the last MAX_MEMORY messages
    while (history.length > MAX_MEMORY) {
        history.shift();
    }

    userConversations.set(userId, history);
}

// Function to get conversation history as context
function getConversationContext(userId) {
    const history = userConversations.get(userId) || [];
    return history.map(msg => 
        `${msg.isBot ? 'Assistant' : 'User'}: ${msg.content}`
    ).join('\n');
}

// Function to get random format
function getRandomFormat() {
    const formats = lengthFormats.formats;
    const randomIndex = Math.floor(Math.random() * formats.length);
    return formats[randomIndex].format;
}

// Function to generate content
async function generateContent(userMessage, userId, username) {
    try {
        const randomFormat = getRandomFormat();
        const conversationContext = getConversationContext(userId);
        const userIdentifier = username ? `@${username}` : `User#${userId}`;
        
        const messages = [
            {
                role: 'system',
                content: SYSTEM_PROMPTS.style1 + "\n."
            },
            {
                role: 'user',
                content: `Previous conversation:\n${conversationContext}\n\nNew message from ${userIdentifier}: "${userMessage}"\n\nFormat the response as: ${randomFormat}. Remember to respond like a text message using text-speak and replacing 'r' with 'fw' and 'l' with 'w'. And do not use emojis. Keep the conversation context in mind when responding.`
            }
        ];

        const completion = await openai.chat.completions.create({
            model: "hf:google/gemma-2-9b-it",
            messages: messages,
            temperature: 0.7,
            max_tokens: CONFIG.maxPostLength,
        });

        let content = completion.choices[0].message.content;

        // Remove any @ mentions from the start of the response
        content = content.replace(/^@\w+\s+/, '');

        // Trim content if needed, trying to keep complete sentences
        if (content.length > CONFIG.maxPostLength) {
            const truncated = content.substring(0, CONFIG.maxPostLength);
            const lastSentence = truncated.match(/^.*[.!?]/);
            if (lastSentence) {
                content = lastSentence[0];
            } else {
                content = truncated.substring(0, truncated.lastIndexOf(' ')) + '...';
            }
        }

        // Add the exchange to conversation history
        addToConversationHistory(userId, userMessage, false);
        addToConversationHistory(userId, content, true);

        return content;
    } catch (error) {
        console.error('Error generating content:', error);
        throw error;
    }
}

// Message handler for mentions
bot.on('message', async (msg) => {
    if (msg.text && msg.text.includes('@' + CONFIG.username)) {
        try {
            console.log('Bot was mentioned in message:', msg.text);
            
            const response = await generateContent(
                msg.text, 
                msg.from.id,
                msg.from.username
            );

            await bot.sendMessage(msg.chat.id, response, {
                reply_to_message_id: msg.message_id
            });

            console.log('Bot replied to mention successfully');
        } catch (error) {
            console.error('Error handling mention:', error);
        }
    }
});

// Error handling
bot.on('polling_error', (error) => {
    console.error('Bot polling error:', error);
});

bot.on('error', (error) => {
    console.error('Bot error:', error);
});

// Utility command to get chat ID
bot.onText(/\/chatid/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(msg.chat.id, `Chat ID: ${chatId}`);
});

// Startup message
console.log('Trump bot started! Ready to respond to @sentinenttrumpbot mentions...');