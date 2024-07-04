const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs').promises; // Use the promises API for async/await
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setsystemprompt')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDescription('Set ChatGPT system prompt.'),

    async execute(interaction) {
        let currentPrompt = '';

        try {
            const dataPath = path.join(__dirname, '..', '..', 'data', 'systemPrompt.json');
            const fileContent = await fs.readFile(dataPath, 'utf8');
            const jsonContent = JSON.parse(fileContent);
            currentPrompt = jsonContent.content || '';
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('Error reading system prompt file:', error);
            }
        }

        const modal = new ModalBuilder()
            .setCustomId('setsystemprompt')
            .setTitle('Set ChatGPT system prompt');

        const descriptionInput = new TextInputBuilder()
            .setCustomId('description')
            .setLabel('Prompt')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setValue(currentPrompt); // Set the current prompt as the value

        const firstActionRow = new ActionRowBuilder().addComponents(descriptionInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
    },
};
