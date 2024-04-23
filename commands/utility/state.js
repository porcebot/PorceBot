const { SlashCommandBuilder, StringSelectMenuBuilder, PermissionFlagsBits, ActionRowBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('state')
        .setDescription('Setup a select menu of states in the United States.')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const select = new StringSelectMenuBuilder()
            .setCustomId('stateSetupMenu')
            .setPlaceholder('Select what letter your state starts with.')
            .addOptions([
                {
                    label: 'A-M',
                    description: 'States from Alabama to Missouri.',
                    value: 'statesListFirst'
                },
                {
                    label: 'M-W',
                    description: 'States from Montana to Wyoming.',
                    value: 'statesListSecond'
                }
            ]);

        const row = new ActionRowBuilder()
            .addComponents(select);

        await interaction.reply({
            content: 'Pick a state range in the United States.',
            components: [row],
            ephemeral: false
        });
    },
};