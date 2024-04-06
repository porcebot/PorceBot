const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handling chat input commands
        if (!interaction.isUserContextMenuCommand()) {
            return;
        }
        if (interaction.commandName === 'Assign Verified') {
            const roles = ['Verified Cutie', 'Active']
            const member = await interaction.guild.members.fetch(interaction.targetId);
            for (const roleName of roles) {
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