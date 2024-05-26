const { SlashCommandBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const filePath = path.join(__dirname, '..', '..', 'events', 'personalityTraits.json');

function readPersonalityTraits() {
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    }
    return {};
}

function getUserTraits() {
    const personalityTraits = readPersonalityTraits();
    return personalityTraits || "No traits found.";
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('traits')
        .setDescription('Read traits of users set in ChatGPT conversations.'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false }).catch(console.error);
        const userTraits = getUserTraits();
        await interaction.editReply({ content: `## PorceBot GPT traits of users:\n\`\`\`json\n${JSON.stringify(userTraits, null, 2)}\n\`\`\``, ephemeral: false });
    },
};
