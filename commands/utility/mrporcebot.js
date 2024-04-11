const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();
const tenor_token = process.env.TENOR_TOKEN;
const client_key = process.env.CLIENT_ID;

let lastCommandTime = 0;
const cooldownDuration = 3000;

function ensureQuestionMark(str) {
    if (!str.endsWith('?')) {
        str += '?';
    }
    return str;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mrporcebot')
        .setDescription('Let Mr. PorceBot answer your fate.')
        .addStringOption(option =>
            option.setName('question')
                .setRequired(true)
                .setDescription('State your question.')),

    async execute(interaction) {
        try {
            const currentTime = Date.now();
            if (currentTime - lastCommandTime < cooldownDuration) {
                await interaction.reply({ content: "Please wait a bit before getting another cat gif.", ephemeral: true }).catch(console.error);
                return;
            }
            lastCommandTime = currentTime;


            const input = interaction.options.getString('question');
            const cat = "cat";
            const search_limit = 20;
            const user = interaction.user;
            //const search_fluff = ["tired", "silly", "exhausted", "kiss", "love", "fast", "cute", "paws", "hug", "sus", "stare", "smile", "slap", "yapping", "ponder", "chill", "lick", "dance", "yippee", "shock", "cozy", "snack"]
            const search_fluff = ["no", "yes", "stare"]
            //const answer_fluff = ["This is what PorceBot has to say about it...", "What does PorceBot think? Well...", "PorceBot answered with...", "Well, you see...", ""]
            const index = Math.floor(Math.random() * search_fluff.length);
            const search_term = cat + " " + search_fluff[index];
            const response = await fetch("https://tenor.googleapis.com/v2/search?q=" + search_term + "&key=" + tenor_token + "&client_key=" + client_key + "&limit=" + search_limit);
            const data = await response.json();
            const randomIndex = Math.floor(Math.random() * data.results.length);
            const inputWithQuestionMark = ensureQuestionMark(input)

            await interaction.reply({ content: `${user} has asked a question...\n` + `# "${inputWithQuestionMark}"\n` + '### *This is what PorceBot has to say about it:*\n' + data.results[randomIndex].url }).catch(console.error);
        } catch (error) {
            console.error('Error fetching cat gif:', error);
        }
    },
};