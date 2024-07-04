const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs').promises; // Use the promises API for async/await
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setpersonalityothers')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .setDescription(`Set someone else's personality description.`)
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Select a user to set their personality')
                .setRequired(true)
        ),

    async execute(interaction) {


        let currentPrompt = '';
        const targetId = interaction.options.getUser('target').id

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
            .setCustomId('setpersonalityothers')
            .setTitle('Set Their Personality');
        const userIdInput = new TextInputBuilder()
            .setMaxLength(30)
            .setMinLength(1)
            .setRequired(true)
            .setPlaceholder('User ID')
            .setLabel("User ID")
            .setValue(targetId)
            .setCustomId('id')
            .setStyle(TextInputStyle.Short);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('description')
            .setLabel('Describe them (max 100 characters)')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(100)
            .setValue(currentPrompt)
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(userIdInput);
        const secondActionRow = new ActionRowBuilder().addComponents(descriptionInput);
        modal.addComponents(firstActionRow, secondActionRow);

        await interaction.showModal(modal);
    },
};
