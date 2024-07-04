const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs').promises; // Use the promises API for async/await
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setpersonality')
        .setDescription('Set your personality description.'),

    async execute(interaction) {

        let currentPrompt = '';
        const targetId = interaction.user.id

        try {
            const dataPath = path.join(__dirname, '..', '..', 'data', 'personalityTraits.json');
            const fileContent = await fs.readFile(dataPath, 'utf8');
            const jsonContent = JSON.parse(fileContent);
            currentPrompt = jsonContent[targetId].traits || '';
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('Error reading system prompt file:', error);
            }
        }

        const modal = new ModalBuilder()
            .setCustomId('setpersonality')
            .setTitle('Set Your Personality');

        const descriptionInput = new TextInputBuilder()
            .setCustomId('description')
            .setLabel('Describe yourself (max 100 characters)')
            .setStyle(TextInputStyle.Paragraph)
            .setValue(currentPrompt)
            .setMaxLength(100)
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(descriptionInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
    },
};
