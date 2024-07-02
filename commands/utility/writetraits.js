const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setpersonality')
        .setDescription('Set your personality description.'),

    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('setpersonality')
            .setTitle('Set Your Personality');

        const descriptionInput = new TextInputBuilder()
            .setCustomId('description')
            .setLabel('Describe yourself (max 100 characters)')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(100)
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(descriptionInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
    },
};
