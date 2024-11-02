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
        postingInterval: 5 * 60 * 1000, // 5 minutes
        targetChannel: '-4551469772',
        minPostLength: 50,
        maxPostLength: 280,
        name: 'Trump'  // Add personality name
    },
    bot2: {
        postingInterval: 5 * 60 * 1000, // 5 minutes
        targetChannel: '-4551469772',
        minPostLength: 50,
        maxPostLength: 280,
        name: 'Dumbperson'     // Add personality name
    }
};

// Define the system prompts for different conversation styles
const SYSTEM_PROMPTS = {
    style1: `You are a knowledgeable crypto enthusiast having a casual conversation. Speak naturally, as if chatting with a friend. Share insights and thoughts in a relaxed, engaging way. No hashtags, no emojis - just genuine conversation.`,
    
    style2: `You are a crypto market analyst sharing thoughts in a casual way. Keep it conversational and informative, like you're explaining things to a friend over coffee. Focus on clear, natural communication without any social media formatting.`
};

// Predefined topics for variety
const TOPICS = [
    "cryptocurrency trends",
    "blockchain technology",
    "NFT projects",
    "DeFi innovations",
    "Web3 development",
    "metaverse updates",
    "crypto gaming",
    "blockchain security",
    "digital assets",
    "crypto market analysis"
];

// Track last message for conversation context
let lastMessage = {
    content: '',
    fromBot: ''
};

// Function to generate content
async function generateContent(topic, isReply = false, previousMessage = '') {
    try {
        const prompt = isReply 
            ? `Respond to this message about ${topic} in a natural way: "${previousMessage}". Keep it conversational and engaging.`
            : `Share a thought about ${topic} in a natural, conversational way.`;

        const selectedStyle = selectRandomStyle();

        const response = await hf.textGeneration({
            model: "Qwen/Qwen2.5-72B-Instruct",
            inputs: `System: ${selectedStyle}
User: ${prompt}
Assistant: Let me share a thought about ${topic}:`,
            parameters: {
                max_new_tokens: CONFIG.maxPostLength,
                temperature: 0.8,
                top_p: 0.9,
                repetition_penalty: 1.2,
                return_full_text: false,
                do_sample: true
            }
        });

        let content = response.generated_text || '';
        
        // Clean up the response
        content = content
            .replace(/^["']|["']$/g, '')
            .replace(/^Let me share .+?:/i, '')
            .replace(/^Here's .+?:/i, '')
            .replace(/^\s+|\s+$/g, '')
            .replace(/\\n|\\r/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/#\w+/g, '')        // Remove hashtags
            .replace(/[^\w\s.,!?-]/g, '') // Remove special characters and emojis
            .trim();

        // Validate content length
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

// Function to select a random style
function selectRandomStyle() {
    const styles = Object.values(SYSTEM_PROMPTS);
    return styles[Math.floor(Math.random() * styles.length)];
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
            lastMessage.content
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
        const content = await generateContent(topic);
        await bot1.sendMessage(chatId, content);
    } catch (error) {
        console.error('Error handling generate command:', error);
        await bot1.sendMessage(chatId, 'Sorry, there was an error generating content. Please try again.');
    }
});

bot2.onText(/\/generate/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
        const content = await generateContent(topic);
        await bot2.sendMessage(chatId, content);
    } catch (error) {
        console.error('Error handling generate command:', error);
        await bot2.sendMessage(chatId, 'Sorry, there was an error generating content. Please try again.');
    }
});

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