const { Events, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const { states } = require('../utils/states');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handling chat input commands
        if (!interaction.isStringSelectMenu()) return;

        switch (interaction.customId) {
            case 'stateSetupMenu':
                // Handle the first level state selection
                handleStateSetupMenu(interaction);
                break;
            case 'stateSelect':
                // Handle the specific state selection
                handleStateSelection(interaction);
                break;
        }
    },
};
async function handleStateSetupMenu(interaction) {
    let options;
    const statesFirstHalf = states.slice(0, 25);
    const statesSecondHalf = states.slice(25);
    if (interaction.values[0] === 'statesListFirst') {
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
    await interaction.reply({
        content: 'Select your state:',
        components: [newStateRow],
        ephemeral: true // This menu is only visible to the user
    });
}

async function handleStateSelection(interaction) {
    const chosenState = interaction.values[0];
    const guild = interaction.guild;
    const member = interaction.member;

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
            return await interaction.reply({
                content: `Failed to create the role for ${chosenState}. Please contact an administrator.`,
                ephemeral: true
            });
        }
    }
    try {
        await member.roles.add(role);
        await interaction.reply({
            content: `You have been assigned to the ${chosenState} role successfully!`,
            ephemeral: true
        });
    } catch (error) {
        console.error('Failed to assign the role:', error);
        await interaction.reply({
            content: `Failed to assign the role for ${chosenState}. Please contact an administrator.`,
            ephemeral: true
        });
    }
}
