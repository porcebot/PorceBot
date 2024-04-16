const { SlashCommandBuilder, StringSelectMenuBuilder, PermissionFlagsBits, ActionRowBuilder } = require('discord.js');
const { states } = require('../../utils/states');
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
            ephemeral: true
        });


        // Directly listen to interactions on this reply
        const filter = i => i.customId === 'stateSetupMenu';
        const collector = interaction.channel.createMessageComponentCollector({ filter });

        const selectFilter = i => i.customId === 'stateSelect';
        const selectCollector = interaction.channel.createMessageComponentCollector({ selectFilter });

        collector.on('collect', async i => {
            if (i.customId === 'stateSetupMenu') {
                let options;
                const statesFirstHalf = states.slice(0, 25);
                const statesSecondHalf = states.slice(25);
                if (i.values[0] === 'statesListFirst') {
                    options = statesFirstHalf;
                } else {
                    options = statesSecondHalf;
                }

                const stateSelect = new StringSelectMenuBuilder()
                    .setCustomId('stateSelect')
                    .setPlaceholder('Select a state.')
                    .addOptions(
                        options.map(state => ({
                            label: state,
                            value: state
                        }))
                    );

                const newStateRow = new ActionRowBuilder().addComponents(stateSelect);

                // Respond or update the interaction
                await i.reply({
                    content: 'Select your state:',
                    components: [newStateRow],
                    ephemeral: true // This menu is only visible to the user
                });
            }
        });

        selectCollector.on('collect', async i => {
            if (i.customId === 'stateSelect') {
                const chosenState = i.values[0];
                const guild = i.guild;
                const member = i.member;

                let role = guild.roles.cache.find(role => role.name === chosenState);

                const allStates = [...states];
                const existingRole = member.roles.cache.find(role => allStates.includes(role.name));

                if (existingRole && existingRole.name !== chosenState) {
                    await member.roles.remove(existingRole);
                }

                if (!role) {
                    // If the role does not exist, create it
                    try {
                        role = await guild.roles.create({
                            name: chosenState,
                            reason: `Create role for state: ${chosenState}:`
                        });
                    } catch (error) {
                        console.log(error)
                        return await i.reply({
                            content: `Failed to create the role for ${chosenState}. Please contact an administrator.`,
                            ephemeral: true
                        });
                    }
                }
                try {
                    await member.roles.add(role);
                    await i.reply({
                        content: `You have been assigned to the ${chosenState} role successfully!`,
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('Failed to assign the role:', error);
                    await i.reply({
                        content: `Failed to assign the role for ${chosenState}. Please contact an administrator.`,
                        ephemeral: true
                    });
                }
            }
        });

        collector.on('end', collected => console.log(`Collected ${collected.size} interactions.`));
    },
};