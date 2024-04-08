const { Events, ChannelType } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handling chat input commands
        if (!interaction.isUserContextMenuCommand()) {
            return;
        }
        if (interaction.commandName === 'Boycourt') {
            return;
        }

        // Fetch the #mod-bot channel
        const modBotChannel = interaction.guild.channels.cache.find(channel => channel.name === 'mod-bot' && channel.type === ChannelType.GuildText);
        const targetUser = await interaction.guild.members.fetch(interaction.targetId).catch(console.error);

        if (!modBotChannel) {
            console.log("Could not find the #mod-bot channel.");
            return;
        }

        // Compose a message about the interaction
        const interactionInfo = `**${interaction.user.globalName}** (${interaction.user.tag}) used the command '${interaction.commandName}' on ${targetUser}.`;

        // Send the message to the #mod-bot channel
        await modBotChannel.send({ content: interactionInfo }).catch(console.error);
    },
};
