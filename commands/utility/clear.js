const { ActionRowBuilder, ChannelType, ButtonBuilder, ButtonStyle, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear messages in this channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addIntegerOption(option =>
            option.setName('amount')
                .setRequired(true)
                .setDescription('Set the amount of messages to be deleted')
                .setMinValue(2)
                .setMaxValue(100)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true }).catch(console.error);
        const amount = interaction.options.getInteger('amount'); // User question
        const serverName = interaction.guild.name;

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
            .setDescription(`Are you sure you want to clear the last ${amount} messages?`)

        await interaction.editReply({ content: ' ', embeds: [embed], components: [row], ephemeral: true });

        // Create a filter to only collect button interactions with the customId 'cancel' or 'confirm'
        const filter = i => (i.customId === 'cancel' || i.customId === 'confirm') && i.user.id === interaction.user.id;

        // Create a collector on the interaction channel to listen for buton presses
        const collector = interaction.channel.createMessageComponentCollector({ filter }); // 15-second time limit for demo

        collector.on('collect', async i => {
            if (i.customId === 'cancel') {
                await i.update({ content: 'The command has been cancelled.', components: [], embeds: [], ephemeral: true }); // Update the message to show cancellation and remove buttons
                collector.stop('cancelled'); // Stop the collector
            }
            // Check if this is the confirm button
            if (i.customId === 'confirm') {
                let deletedMessages = 0; // Initialize deleted messages count
                try {
                    const deleted = await interaction.channel.bulkDelete(amount, true);
                    deletedMessages = deleted.size;
                } catch (error) {
                    console.log(error)
                    await interaction.editReply({ content: 'Failed to clear messages. Please try again later.', embeds: [], components: [], ephemeral: true });
                    return;
                } finally {
                    const kickedEmbed = new EmbedBuilder()
                        .setColor(0x0099FF) // You can set the color to whatever you prefer
                        .setTitle(`${serverName} has been saved!`)
                        .setImage('https://i.imgur.com/vpq4fFT.gif')
                        .setDescription(`You made the server cute again.`)
                        .addFields(
                            { name: 'Amount of messages cleared:', value: `${deletedMessages}` },
                        )

                    // Confirm the action
                    await interaction.editReply({ content: ' ', embeds: [kickedEmbed], components: [], ephemeral: true });
                    collector.stop('confirmed'); // Stop the collector

                    const modBotChannel = interaction.guild.channels.cache.find(channel => channel.name === 'mod-bot' && channel.type === ChannelType.GuildText);
                    if (modBotChannel) {
                        // Compose a message about the interaction
                        const interactionInfo = `**${interaction.user.globalName}** (${interaction.user.tag}) used the command '${interaction.commandName}' to clear messages. Amount cleared: ${deletedMessages}`;
                        // Send the message to the #mod-bot channel
                        await modBotChannel.send({ content: interactionInfo }).catch(console.error);
                    }
                }
            }
        });
    },
};
