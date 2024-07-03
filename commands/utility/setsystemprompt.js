const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setsystemprompt')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDescription('Set ChatGPT system prompt.'),

    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('setsystemprompt')
            .setTitle('Set ChatGPT system prompt');

        const descriptionInput = new TextInputBuilder()
            .setCustomId('description')
            .setLabel('Prompt')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(descriptionInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
    },
};