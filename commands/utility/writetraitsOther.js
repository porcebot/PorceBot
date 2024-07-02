const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');

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
        const modal = new ModalBuilder()
            .setCustomId('setpersonalityothers')
            .setTitle('Set Their Personality');
        const userIdInput = new TextInputBuilder()
            .setMaxLength(30)
            .setMinLength(1)
            .setRequired(true)
            .setPlaceholder('User ID')
            .setLabel("User ID")
            .setValue(interaction.options.getUser('target').id)
            .setCustomId('id')
            .setStyle(TextInputStyle.Short);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('description')
            .setLabel('Describe them (max 100 characters)')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(100)
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(userIdInput);
        const secondActionRow = new ActionRowBuilder().addComponents(descriptionInput);
        modal.addComponents(firstActionRow, secondActionRow);

        await interaction.showModal(modal);
    },
};
