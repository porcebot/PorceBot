const { ActionRowBuilder, ChannelType, ButtonBuilder, ButtonStyle, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { badWordsMapped } = require('../../blackListMapped');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearbadwords')
        .setDescription('Clear bad words in this channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true }).catch(console.error);

        // Prepare the confirmation and cancel buttons
        const confirm = new ButtonBuilder()
            .setCustomId('confirm')
            .setLabel('Clear Messages')
            .setStyle(ButtonStyle.Danger);

        const cancel = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder()
            .addComponents(cancel, confirm);


        // Initialize a new embed
        const embed = new EmbedBuilder()
            .setColor(0xFF001A) // You can set the color to whatever you prefer
            .setTitle(`Hooni Maid Service`)
            .setThumbnail('https://i.imgur.com/HZi34GO.png')
            .setDescription(`Are you sure you want to lookup bad words and clear them?`)

        await interaction.editReply({ content: ' ', embeds: [embed], components: [row], ephemeral: true });

        // Create a filter to only collect button interactions with the customId 'cancel' or 'confirm'
        const filter = i => (i.customId === 'cancel' || i.customId === 'confirm') && i.user.id === interaction.user.id;

        // Create a collector on the interaction channel to listen for buton presses
        const collector = interaction.channel.createMessageComponentCollector({ filter }); // 15-second time limit for demo

        collector.on('collect', async i => {
            await interaction.deleteReply()
            await i.deferReply({ ephemeral: false }).catch(console.error);
            if (i.customId === 'cancel') {
                await i.editReply({ content: 'The command has been cancelled.', components: [], embeds: [], ephemeral: false }); // Update the message to show cancellation and remove buttons
                collector.stop('cancelled'); // Stop the collector
            }
            // Check if this is the confirm button
            if (i.customId === 'confirm') {
                let deletedMessages = 0; // Initialize deleted messages count
                let fetched;
                let retryAfter = 0;
                let batchCount = 0;
                let lastMessageId;
                do {
                    if (retryAfter > 0) {
                        await new Promise(resolve => setTimeout(resolve, retryAfter));
                        retryAfter = 0; // Reset the retryAfter delay
                    }
                    try {
                        const options = { limit: 100 };
                        if (lastMessageId) {
                            options.before = lastMessageId;
                        }
                        fetched = await interaction.channel.messages.fetch(options);
                        if (fetched.size === 0) break;
                        const badMessages = fetched.filter(msg =>
                            badWordsMapped.some(word => msg.content.toLowerCase().includes(word.toLowerCase()))
                        );
                        deletedMessages += badMessages.size
                        for (const msg of badMessages.values()) {
                            await msg.delete();
                        }
                        lastMessageId = fetched.last().id;
                    } catch (error) {
                        if (error.code === 50013) { // Check if the error is due to rate limits
                            retryAfter = error.retry_after * 1000; // Convert seconds to milliseconds
                            await i.editReply({ content: `Discord API rate limit reached, hold on for ${retryAfter} seconds...`, embeds: [], components: [], ephemeral: false });
                        } else {
                            await i.editReply({ content: `An error has occurred. Please try again later.`, embeds: [], components: [], ephemeral: false });
                            break;
                        }
                    }
                    batchCount++;
                    await i.editReply({ content: `Batch ${batchCount} complete. Latest msg id: ${lastMessageId} Please wait...`, embeds: [], components: [], ephemeral: false });
                } while (batchCount < 10);
                await i.editReply({ content: `Cleared ${deletedMessages} bad words! Bad Boycord! >:(`, embeds: [], components: [], ephemeral: false });
                const modBotChannel = interaction.guild.channels.cache.find(channel => channel.name === 'mod-bot' && channel.type === ChannelType.GuildText);
                if (modBotChannel) {
                    // Compose a message about the interaction
                    const interactionInfo = `**${interaction.user.globalName}** (${interaction.user.tag}) used the command '${interaction.commandName}' to clear messages. Amount cleared: ${deletedMessages}`;
                    // Send the message to the #mod-bot channel
                    await modBotChannel.send({ content: interactionInfo }).catch(console.error);
                }

                collector.stop('confirmed'); // Stop the collector
            }
        });
    },
};
