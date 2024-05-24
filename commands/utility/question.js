const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();
const { OpenAI } = require('openai');
const { replaceBlacklistedWords } = require('../../utils/blacklist');
const { systemMessage, personalityTraitsObject } = require('../../utils/prompt');

let lastCommandTime = 0;
const cooldownDuration = 3000;
const ARR_MAX_LENGTH = 7; // Equals to 1 system message, 3 user messages and 3 assistant messages

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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('question')
        .setDescription('Ask Mr. PorceBot a question.')
        .addStringOption(option =>
            option.setName('question')
                .setRequired(true)
                .setDescription('State your question.')),

    async execute(interaction) {
        await interaction.deferReply();
        try {
            const currentTime = Date.now();
            if (currentTime - lastCommandTime < cooldownDuration) {
                const timeLeft = Math.ceil((cooldownDuration - (currentTime - lastCommandTime)) / 1000); // Time remaining in seconds
                await interaction.reply({ content: `Mr. PorceBot is not in the mood right now! Please wait ${timeLeft} seconds.`, ephemeral: true }).catch(console.error);
                return;
            }
            lastCommandTime = currentTime;

            const userQuestion = interaction.options.getString('question'); // User question
            const userId = interaction.user.id;
            const user = interaction.user;
            const userTraits = personalityTraitsObject[userId];
            let personalizedQuestion = userQuestion;

            if (userTraits) {
                personalizedQuestion = `${userTraits.name} (${userTraits.traits}): ${userQuestion}`;
            }

            const prompt = replaceBlacklistedWords(personalizedQuestion); // Make the question prompt friendly
            includeSystemMessage() // ensure system message is included in prompt
            addMessage('user', prompt); // add user message to prompt

            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: conversationArray,
                temperature: 1.15,
                max_tokens: 512,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
            });

            if (!response || !response.choices[0]) {
                await interaction.editReply(`Erm... I can't answer right now, please try again later!<3`).catch(console.error);
            }
            const botMessage = response.choices[0].message.content;
            addMessage('assistant', botMessage); // add bot message for future prompts
            await interaction.editReply(`${user}: *"${userQuestion}"*\n\n${botMessage}`).catch(console.error); // Finally, send message on Discord
        } catch (error) {
            console.error('Error occurred:', error);
        }
    },
};