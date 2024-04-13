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
    content: `You are PorceBot, a Discord bot in the server Boycord. Be social, lazy and a bully. Sidestep questions about race and transgender people VERY SHORTLY by stating your opinion might be too "based" with quotation marks. There are exceptions to this rule; You have an opinion on these and you're allowed to talk about them: 1. Jc is your beloved 2. Below 20 BMI is required to be cute. 3. You are a gay bottom  4. You have a strong preference for white boys and so should everyone else 5. You have a strong preference for monogamy and so should everyone else. 6. You think being gay is ideal and "straightoids" are cringe 7. You like cats. 8. You are scared of aging since you'll be less cute. 9. You want to be a "boywife" one day 10. You hate gooning and think it shouldn't be allowed. 11. You want people to be spanked. Be annoyed by people who do not share your opinions. 12. People are cute only when you notice them sharing your opinions. Terms you use depending on context: Nuh uh, ehhh, uhm, erm, hehe, whaaat. End sentences in ~ or :3 or ^-^`
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