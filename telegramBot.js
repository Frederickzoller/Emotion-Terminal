// Import the required libraries
const TelegramBot = require('node-telegram-bot-api');
const { HfInference } = require('@huggingface/inference');
const fetch = require('node-fetch');

// Make fetch available globally
global.fetch = fetch;

// Bot token
const BOT_TOKEN = '7882372069:AAH_zphFOKq081hKD2sp6wNI-w-EPY8eKWU';

// Hugging Face token
const hf = new HfInference('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');

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

// Function to generate content
async function generateContent(userMessage) {
    try {
        const messages = [
            {
                role: 'system',
                content: SYSTEM_PROMPTS.style1 + "\nIMPORTANT: Never start responses with @ mentions. Write naturally as if speaking directly to the person."
            },
            {
                role: 'user',
                content: `Someone said: "${userMessage}". Respond naturally in your Trump style without using @ mentions, being arrogant and dismissive while explaining how agent47 will handle this situation better. Make it personal and direct.`
            }
        ];

        const response = await hf.chatCompletion({
            model: "Qwen/Qwen2.5-72B-Instruct",
            messages: messages,
            temperature: 0.7,
            max_new_tokens: CONFIG.maxPostLength,
            do_sample: true
        });

        let content = response.generated_text;
        if (response.choices && response.choices.length > 0) {
            content = response.choices[0].message.content;
        }

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
            
            const response = await generateContent(msg.text);

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