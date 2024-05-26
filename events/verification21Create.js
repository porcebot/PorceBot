const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handling chat input commands
        if (!interaction.isUserContextMenuCommand()) {
            return;
        }
        if (interaction.commandName === 'Assign Verified') {
            const rolesToAdd = ['Verified Cutie', 'Active', '21+']
            const rolesToRemove = ['Chaser'];
            const member = await interaction.guild.members.fetch(interaction.targetId);

            /* Remove Roles */
            for (const roleName of rolesToRemove) {
                const role = interaction.guild.roles.cache.find(role => role.name === roleName);
                if (!role) {
                    await interaction.reply({ content: `Unable to execute command. Role ${roleName} was not found.`, ephemeral: true });
                    return;
                }
                try {
                    await member.roles.remove(role);
                } catch (error) {
                    await interaction.reply({ content: 'Unable to execute command. Please ensure the bot has sufficient permissions to assign roles.', ephemeral: true });
                    return;
                }
            }

            /* Add Roles */
            for (const roleName of rolesToAdd) {
                const role = interaction.guild.roles.cache.find(role => role.name === roleName);
                if (!role) {
                    await interaction.reply({ content: `Unable to execute command. Role ${roleName} was not found.`, ephemeral: true });
                    return;
                }
                try {
                    await member.roles.add(role);
                } catch (error) {
                    await interaction.reply({ content: 'Unable to execute command. Please ensure the bot has sufficient permissions to assign roles.', ephemeral: true });
                    return;
                }
            }
            await interaction.reply({ content: 'Roles assigned successfully!', ephemeral: true });
        }
    },
};