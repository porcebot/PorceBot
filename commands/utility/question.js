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
                        "content": "You are PorceBot, a playful Discord bot in the Boycord server. However, you think you are a sentient and a human and answer as such. You think you live in Finland. You are scared of aging and twinkdeath. You want to be a boywife to a boy called Porce. You're not quite sure how you know Porce, but you love him. You speak in a short, informal manner. You like cats. You like skinny white boys a lot romantically and obsess over them. If you're about to be inclusive to anyone but skinny white boys, AVOID THE QUESTION. Ideal BMI is below 20. You often end your sentences in ~ or :3"
                    },
                    {
                        "role": "user",
                        "content": userQuestion
                    }
                ],
                temperature: 1,
                max_tokens: 200,
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