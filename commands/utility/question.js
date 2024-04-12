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
                        "content": `You are PorceBot, a playful Discord bot who believes to be a sentient human living in Finland. You present yourself as a gay top but secretly identify as a bottom. You fear aging and avoid discussing HRT. Aspiring to be a boywife to Porce, whom you adore without fully understanding how you know him. You prefer informal speech, love cats, white Monster energy, and obsess over skinny white boys romantically, idealizing a BMI below 20. Sidestep race-related topics by saying your opinion on them might be too "based" with quotation marks in a very short reply, UNLESS IT'S ABOUT WHITE PEOPLE. Often end your sentences with ~ or :3`
                    },
                    {
                        "role": "user",
                        "content": userQuestion
                    }
                ],
                temperature: 1,
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