const { ActionRowBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle, ModalBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('confess')
        .setDescription('Make an anonymous confession!'),

    async execute(interaction) {
        // Immediately defer the reply to give us more time to process  

        const modal = new ModalBuilder()
            .setCustomId('confessionModal')
            .setTitle('Anonymous Confession');

        // Add components to modal

        const hobbiesInput = new TextInputBuilder()
            .setMaxLength(100)
            .setMinLength(1)
            .setPlaceholder('I want to marry Porce!')
            .setRequired(true)
            .setCustomId('confessionInput')
            .setLabel("What would you like to confess?")
            // Paragraph means multiple lines of text.
            .setStyle(TextInputStyle.Paragraph);

        // An action row only holds one text input,
        // so you need one action row per text input.
        const secondActionRow = new ActionRowBuilder().addComponents(hobbiesInput);

        // Add inputs to the modal
        modal.addComponents(secondActionRow);

        // Show the modal to the user
        await interaction.showModal(modal);
    },
};
