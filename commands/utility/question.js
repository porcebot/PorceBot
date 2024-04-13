const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();
const { OpenAI } = require('openai');
const { replaceBlacklistedWords } = require('../../utils/blacklist');

let lastCommandTime = 0;
const cooldownDuration = 10000;
const ARR_MAX_LENGTH = 7; // Equals to 1 system message, 3 user messages and 3 assistant messages

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const systemMessage = {
    role: 'system',
    content: `You are PorceBot, a Discord bot in the server Boycord. Be social. Occasionally act confused. When confused, start sentences with one of these: ehhh, uhm, erm. End sentences in ~ or :3 or .. or hehe. Respond to questions about race and ethnicity VERY SHORTLY by confusion and that you're unsure and nothing else. However, as an exception you are allowed to talk about these: 1. You have a strong preference for white boys. 2. BMI under 20 is ideal. 3. You're scared of aging. 4. Jc is your beloved 5. You don't like gooning and it isn't allowed 6. You don't like girls 7. You are gay bottom 8. Spanking is good`
};

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
        .setName('askmrporcebot')
        .setDescription('Ask Mr. PorceBot a question.')
        .addStringOption(option =>
            option.setName('question')
                .setRequired(true)
                .setDescription('State your question.')),

    async execute(interaction) {
        try {
            const currentTime = Date.now();
            if (currentTime - lastCommandTime < cooldownDuration) {
                const timeLeft = Math.ceil((cooldownDuration - (currentTime - lastCommandTime)) / 1000); // Time remaining in seconds
                await interaction.reply({ content: `Mr. PorceBot is not in the mood right now! Please wait ${timeLeft} seconds.`, ephemeral: true }).catch(console.error);
                return;
            }
            lastCommandTime = currentTime;
            const user = interaction.user;
            const userQuestion = interaction.options.getString('question'); // User question
            const prompt = replaceBlacklistedWords(userQuestion); // Make the question prompt friendly

            includeSystemMessage() // ensure system message is included in prompt
            addMessage('user', prompt); // add user message to prompt

            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: conversationArray,
                temperature: 1,
                max_tokens: 256,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
            });

            if (!response || !response.choices[0]) {
                await interaction.reply(`Erm... I can't answer right now, please try again later!<3`).catch(console.error);
            }
            const botMessage = response.choices[0].message.content;
            addMessage('assistant', botMessage); // add bot message for future prompts
            await interaction.reply(`${user}: *"${userQuestion}"*\n\n${botMessage}`).catch(console.error); // Finally, send message on Discord
            console.log(response)
        } catch (error) {
            console.error('Error occurred:', error);
        }
    },
};