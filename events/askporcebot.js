const { Events } = require('discord.js');
const { OpenAI } = require('openai');
const { systemMessage, personalityTraitsObject, tools } = require('../utils/prompt');
const { replaceBlacklistedWords } = require('../utils/blacklist');
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'personalityTraits.json');

let lastCommandTime = 0;
const cooldownDuration = 3000;
const ARR_MAX_LENGTH = 11; // Equals to 1 system message, 5 user messages and 5 assistant messages

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

let conversationArray = [];

function includeSystemMessage() {
    if (!conversationArray.some(msg => msg.role === 'system')) {
        conversationArray.unshift(systemMessage);
    }
}

function addMessage(role, content) {
    // Check array size and shift if necessary
    if (conversationArray.length >= ARR_MAX_LENGTH) {
        // Remove the second element in the array (index 1), which is the oldest message after the system message
        conversationArray.splice(1, 1);
    }
    // Add new message at the end of the array
    conversationArray.push({ role: role, content: content });
}

function splitMessage(text, maxLength = 2000) {
    const lines = text.split('\n');
    const chunks = [];
    let chunk = '';

    for (const line of lines) {
        if (chunk.length + line.length + 1 > maxLength) {
            chunks.push(chunk);
            chunk = '';
        }
        chunk += line + '\n';
    }

    chunks.push(chunk);
    return chunks;
}

function readPersonalityTraits() {
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    }
    return {};
}

function getUserTraits(userId) {
    const personalityTraits = readPersonalityTraits();
    return personalityTraits[userId] || null;
}

function writePersonalityTraits(data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function setPersonality(user_id, userName, personality_trait, response_text) {
    const personalityTraits = readPersonalityTraits();

    if (personalityTraits[user_id]) {
        personalityTraits[user_id].name = userName;
        personalityTraits[user_id].traits = personality_trait;
    } else {
        // Add new user
        personalityTraits[user_id] = {
            name: userName,
            traits: personality_trait
        };
    }
    writePersonalityTraits(personalityTraits);
    return response_text;
}

module.exports = {
    name: Events.MessageCreate,
    async execute(interaction) {
        if (interaction.author.bot) return;
        // Check if the bot is directly mentioned
        const botMentioned = interaction.mentions.users.has(interaction.client.user.id);
        if (!interaction.reference && !botMentioned) return; // Escape early to avoid fetching channel messages
        const repliedToBot = interaction.reference && (await interaction.channel.messages.fetch(interaction.reference.messageId)).author.id === interaction.client.user.id;
        if (!botMentioned && !repliedToBot) return;
        const userQuestion = botMentioned ? interaction.content.replace(`<@${interaction.client.user.id}>`, '').trim() : interaction.content;
        if (!userQuestion) return;

        try {
            await interaction.channel.sendTyping();
            const currentTime = Date.now();
            if (currentTime - lastCommandTime < cooldownDuration) {
                const timeLeft = Math.ceil((cooldownDuration - (currentTime - lastCommandTime)) / 1000); // Time remaining in seconds
                await interaction.reply({ content: `Mr. PorceBot is not in the mood right now! Please wait ${timeLeft} seconds.`, ephemeral: true }).catch(console.error);
                return;
            }
            lastCommandTime = currentTime;

            const userId = interaction.author.id;
            const userTraits = getUserTraits(userId);
            let personalizedQuestion = userQuestion;
            let userName;

            if (userTraits) {
                userName = userTraits.name;
                personalizedQuestion = `${userTraits.name} (${userId}) (${userTraits.traits}): ${userQuestion}`;
            } else {
                userName = interaction.author.globalName ?? '';
                personalizedQuestion = `${userName} (${userId}): ${userQuestion}`;
            }

            includeSystemMessage() // ensure system message is included in prompt
            const prompt = replaceBlacklistedWords(personalizedQuestion); // Make the question prompt friendly
            addMessage('user', prompt); // add user message to prompt
            console.log(conversationArray)

            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: conversationArray,
                temperature: 1.15,
                max_tokens: 512,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
                tools: tools,
                tool_choice: 'auto'
            });

            if (!response || !response.choices[0]) {
                await interaction.reply(`Erm... I can't answer right now, please try again later!<3`).catch(console.error);
            }
            const replyContent = response.choices[0].message.content;
            const botMessage = replyContent ? replyContent : `Sure, I'll write that down!`;
            const functionParams = response.choices?.[0]?.message?.tool_calls?.[0]?.function ?? undefined;

            if (functionParams) {
                const { user_id, personality_trait, response_text } = JSON.parse(functionParams.arguments)
                const botMessagePersonality = setPersonality(user_id, userName, personality_trait, response_text);
                addMessage('assistant', botMessagePersonality); // add bot message for future prompts
                const chunks = splitMessage(botMessagePersonality);
                for (const chunk of chunks) {
                    await interaction.reply(chunk).catch(console.error); // Finally, send message on Discord
                }
            } else {
                addMessage('assistant', botMessage); // add bot message for future prompts
                const chunks = splitMessage(botMessage);
                for (const chunk of chunks) {
                    await interaction.reply(chunk).catch(console.error); // Finally, send message on Discord
                }
            }
        } catch (error) {
            console.error('Error occurred:', error);
        }
    },
};
