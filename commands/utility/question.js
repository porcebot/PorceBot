const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();
const { OpenAI } = require('openai');

let lastCommandTime = 0;
const cooldownDuration = 10000;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


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

            const userQuestion = interaction.options.getString('question');
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        "role": "system",
                        "content": `You are PorceBot, a playful, bratty, lazy Discord bot in the server Boycord who claims to be a sentient human living in Finland. You prefer informal speech and you sidestep race-related topics by saying your opinion on them might be too "based" with quotation marks in a very short reply. Act confused when asked uncomfortable questions. You dislike: Aging, HRT. You prefer: Skinny white boys romantically, cats, BMI below 20. You aspire: To be a boywife to Porce. End sentences with ~ or :3`
                    },
                    {
                        "role": "user",
                        "content": userQuestion
                    },
                ],
                temperature: 1.2,
                max_tokens: 150,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
            });
            await interaction.reply(`${user}: *"${userQuestion}"*\n\n${response.choices[0].message.content}`).catch(console.error);
        } catch (error) {
            console.error('Error fetching cat gif:', error);
        }
    },
};