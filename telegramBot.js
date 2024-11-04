// Import the required libraries
const TelegramBot = require('node-telegram-bot-api');
const { HfInference } = require('@huggingface/inference');
const fetch = require('node-fetch');

// Make fetch available globally
global.fetch = fetch;

// Bot tokens
const BOT_TOKENS = {
    bot1: '7882372069:AAH_zphFOKq081hKD2sp6wNI-w-EPY8eKWU',
    bot2: '7846059994:AAE9rcRfnnMx_rh7qFPabSak50R1-q5-6bc' // Replace with your second bot token
};

// Hugging Face token
const hf = new HfInference('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');

// Create bot instances
const bot1 = new TelegramBot(BOT_TOKENS.bot1, { polling: true });
const bot2 = new TelegramBot(BOT_TOKENS.bot2, { polling: true });

// Configuration for both bots
const CONFIG = {
    bot1: {
        postingInterval: 2 * 60 * 1000, // 2 minutes
        targetChannel: '-4551469772',
        minPostLength: 40,
        maxPostLength: 80,
        name: 'Trump'  // Add personality name
    },
    bot2: {
        postingInterval: 2 * 60 * 1000, // 2 minutes
        targetChannel: '-4551469772',
        minPostLength: 40,
        maxPostLength: 80,
        name: 'Dumbperson'     // Add personality name
    }
};

// At the top, replace the SYSTEM_PROMPTS and TOPICS with:
const { SYSTEM_PROMPTS, TOPICS } = require('./prompts');

// Track last message for conversation context
let lastMessage = {
    content: '',
    fromBot: ''
};

// Function to generate content
async function generateContent(topic, isReply = false, previousMessage = '', botName) {
    try {
        // Different prompts based on bot and whether it's a reply or not
        let userPrompt;
        if (isReply) {
            if (botName === CONFIG.bot1.name) {
                userPrompt = `Respond to: "${previousMessage}" by mocking it and explaining how agent47 will do things differently and better. Be arrogant and dismissive of the previous message.`;
            } else {
                userPrompt = `Respond to: "${previousMessage}" by doing vague and weak refutals. Question it remaining vague and non-committal about alternatives.`;
            }
        } else {
            userPrompt = `Talk about ${topic}, and say how agent47 will make this happen. You're texting from a cellphone so ortography follows your style guide always.`;
        }

        const selectedStyle = selectRandomStyle(botName);

        // Create messages array with system and user prompts
        const messages = [
            {
                role: 'system',
                content: selectedStyle
            },
            {
                role: 'user',
                content: userPrompt
            }
        ];

        // Use chatCompletion instead of textGeneration
        const response = await hf.chatCompletion({
            model: "Qwen/Qwen2.5-72B-Instruct",
            messages: messages,
            temperature: 0.7,
            max_new_tokens: CONFIG.maxPostLength,            
            do_sample: true
        });

        // Log the raw response
        console.log('\nRaw HuggingFace response:', response);

        // Extract content from chat completion response
        let content = response.generated_text;
        if (response.choices && response.choices.length > 0) {
            content = response.choices[0].message.content;
        }

        // Only validate length
        if (!content || content.length < CONFIG.minPostLength) {
            throw new Error('Generated content too short or empty');
        }

        if (content.length > CONFIG.maxPostLength) {
            content = content.substring(0, CONFIG.maxPostLength - 3) + '...';
        }

        return content;

    } catch (error) {
        console.error('Error generating content:', error);
        throw error;
    }
}

// Function to select style based on bot name (no longer random)
function selectRandomStyle(botName) {
    return botName === CONFIG.bot1.name ? SYSTEM_PROMPTS.style1 : SYSTEM_PROMPTS.style2;
}

// Modified function to post content to channel
async function postToChannel(bot, content, config) {
    try {
        await bot.sendMessage(config.targetChannel, content);
        console.log(`Posted successfully to ${config.targetChannel}`);
    } catch (error) {
        console.error('Error posting to channel:', error.message);
        
        if (error.message.includes('chat not found')) {
            console.error(`
            Troubleshooting steps:
            1. Verify the bot is added to the channel
            2. Make sure the bot is an admin in the channel
            3. Check if the channel username/ID is correct
            4. Try using the channel ID format: -100<channel_number>
            `);
        }
    }
}

// Modified automated posting function with conversation logic
async function automatedPosting(bot, config) {
    try {
        const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
        console.log(`${config.name} generating content for topic:`, topic);
        
        const content = await generateContent(
            topic, 
            lastMessage.content !== '', 
            lastMessage.content,
            config.name
        );

        await postToChannel(bot, content, config);
        
        // Update last message for context
        lastMessage = {
            content: content,
            fromBot: config.name
        };
        
        console.log(`${config.name} posted successfully`);
    } catch (error) {
        console.error(`Error in ${config.name} posting:`, error);
    }
}

// Modified timing to create conversation flow
setTimeout(() => {
    console.log('Starting conversational posting...');
    
    // Bot 1 starts the conversation
    automatedPosting(bot1, CONFIG.bot1);
    
    // Bot 2 responds after a delay
    setTimeout(() => {
        automatedPosting(bot2, CONFIG.bot2);
    }, 30 * 1000); // 30 second delay
    
    // Set up alternating posts
    setInterval(() => {
        automatedPosting(bot1, CONFIG.bot1);
        setTimeout(() => {
            automatedPosting(bot2, CONFIG.bot2);
        }, 30 * 1000);
    }, CONFIG.bot1.postingInterval);
    
}, 5000);

// Manual commands for both bots
bot1.onText(/\/generate/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
        console.log(`${CONFIG.bot1.name} generating content for topic:`, topic);
        const content = await generateContent(topic, false, '', CONFIG.bot1.name);
        const sentMessage = await bot1.sendMessage(chatId, content);
        
        lastMessage = {
            content: content,
            fromBot: CONFIG.bot1.name,
            messageId: sentMessage.message_id,
            topic: topic  // Store the topic for the conversation
        };
        
        setTimeout(() => {
            respondToMessage(bot2, CONFIG.bot2, chatId);
        }, 30 * 1000);
        
    } catch (error) {
        console.error('Error handling generate command:', error);
        await bot1.sendMessage(chatId, 'Sorry, there was an error generating content. Please try again.');
    }
});

// Add new function to handle responses in the conversation loop
async function respondToMessage(bot, config, chatId) {
    try {
        const content = await generateContent(
            null,
            true,
            lastMessage.content,
            config.name
        );

        const sentMessage = await bot.sendMessage(chatId, content, {
            reply_to_message_id: lastMessage.messageId
        });

        lastMessage = {
            content: content,
            fromBot: config.name,
            messageId: sentMessage.message_id,
            topic: lastMessage.topic  // Preserve the original topic
        };

        const nextBot = config.name === CONFIG.bot1.name ? bot2 : bot1;
        const nextConfig = config.name === CONFIG.bot1.name ? CONFIG.bot2 : CONFIG.bot1;

        setTimeout(() => {
            respondToMessage(nextBot, nextConfig, chatId);
        }, 30 * 1000);

    } catch (error) {
        console.error(`Error in ${config.name} response:`, error);
    }
}

// Error handling for both bots
[bot1, bot2].forEach((bot, index) => {
    bot.on('polling_error', (error) => {
        console.error(`Bot ${index + 1} polling error:`, error);
    });

    bot.on('error', (error) => {
        console.error(`Bot ${index + 1} error:`, error);
    });

    bot.onText(/\/chatid/, (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(msg.chat.id, `Chat ID: ${chatId}`);
    });
});

// Startup message
console.log('Both bots started! Automated posting will begin in 5 seconds...');