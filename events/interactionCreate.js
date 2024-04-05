const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handling chat input commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        }

        // Handling modal submissions
        if (interaction.isModalSubmit()) {
            // Example: Handle a specific modal with customId 'confessionModal'
            if (interaction.customId === 'confessionModal') {
                const confession = interaction.fields.getTextInputValue('confessionInput');

                // Specify the ID of the target channel where you want to send the confession
                const targetChannelId = interaction.channelId;
                // Retrieve the channel from the client's channel cache
                const targetChannel = interaction.client.channels.cache.get(targetChannelId);

                const { EmbedBuilder } = require('discord.js');

                // Create an embed instance
                const confessionEmbed = new EmbedBuilder()
                    .setColor(0x0099ff) // Set the embed color
                    .setTitle('Anonymous Confession') // Set the title of the embed
                    .setDescription(confession) // Set the description
                    .setTimestamp() // Add a timestamp to the embed
                    .setThumbnail('https://i.imgur.com/ZIAcuzg.gif');


                if (targetChannel) {
                    // Send the confession as a message to the target channel
                    await targetChannel.send({ embeds: [confessionEmbed] });

                    // Optionally, reply to the user who submitted the modal to acknowledge receipt
                    await interaction.reply({ content: 'Your confession was received and posted!', ephemeral: true });
                } else {
                    // If the channel could not be found, log an error or notify the user
                    console.error('Target channel not found.');
                    await interaction.reply({ content: 'There was an error processing your confession.', ephemeral: true });
                }

            }
        }
    },
};
