const { ActionRowBuilder, ChannelType, ButtonBuilder, ButtonStyle, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Begin the process of eliminating unwanted users.')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true }).catch(console.error);
        // Immediately defer the reply to give us more time to process
        const guild = interaction.guild;
        const serverName = interaction.guild.name;

        const roleNames = ["Twink", "Twunk", "Femboy", "Verified Cutie", "Bot", "Server Booster"];
        const roles = roleNames.map(roleName => guild.roles.cache.find(r => r.name === roleName)).filter(role => role !== undefined);

        // If none of the roles are found, reply accordingly
        if (roles.length === 0) {
            await interaction.reply({
                content: `Could not find any of the preset roles. Please include at least one in your server. The list of accepted roles are the following: "${roleNames.join('", "')}".`,
                ephemeral: true
            });
            return; // Exit the command execution if none of the roles are found
        }

        let membersWithoutRole = [];
        let membersWithoutRoleId = [];

        try {
            // Fetch all members of the guild
            const members = await guild.members.fetch();
            members.forEach(member => {
                // Check if the member does not have any of the specified roles
                const hasNoSpecifiedRoles = roles.every(role => !member.roles.cache.has(role.id));
                const privileged = member.permissions.has(PermissionFlagsBits.KickMembers); // Ignore mods and other privileged users

                if (hasNoSpecifiedRoles && !privileged) {
                    membersWithoutRole.push(member.user.tag); // Add the member's tag to the list
                    membersWithoutRoleId.push(member.user.id)
                }
            });

            const alreadyCuteEmbed = new EmbedBuilder()
                .setColor(0xFF0099) // You can set the color to whatever you prefer
                .setTitle(`${serverName} is already cute!`)
                .setImage('https://i.imgur.com/xMCXrWs.jpeg')
                .setDescription(`There is no need to kick anyone.`)
                .addFields(
                    { name: 'Everyone is one of the following:', value: `${roleNames.join(', ')}` },
                )

            if (membersWithoutRoleId.length === 0) {
                await interaction.editReply({ content: ' ', embeds: [alreadyCuteEmbed] });
                return;
            }

            // Prepare the confirmation and cancel buttons
            const confirm = new ButtonBuilder()
                .setCustomId('confirm')
                .setLabel('Confirm Kick')
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
                .setTitle(`THE UGGOPURGENATOR 2000`)
                .setThumbnail('https://i.imgur.com/tBi2qUC.png')
                .setDescription(`Are you sure you want to kick all these users? Count: (${membersWithoutRole.length})`)
                .addFields(
                    { name: 'These roles are unaffected:', value: `${roleNames.join(', ')}` },
                )

            // Assuming you have an array of user tags, let's split it into chunks to fit into embed fields
            const chunkSize = 10; // Discord has a limit for the number of fields and their length
            const totalChunks = Math.ceil(membersWithoutRole.length / chunkSize);
            // Process only up to the first 10 chunks to avoid exceeding embed limits
            for (let i = 0; i < Math.min(totalChunks, 10); i++) {
                const start = i * chunkSize;
                const end = start + chunkSize;
                const chunk = membersWithoutRole.slice(start, end);
                embed.addFields({ name: ` `, value: chunk.join('\n'), inline: true });
            }

            // Send the embed in a reply or follow-up
            await interaction.editReply({ content: ' ', embeds: [embed], components: [row], ephemeral: true });

            // Create a filter to only collect button interactions with the customId 'cancel' or 'confirm'
            const filter = i => (i.customId === 'cancel' || i.customId === 'confirm') && i.user.id === interaction.user.id;

            // Create a collector on the interaction channel to listen for buton presses
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 20000 }); // 20-second time limit

            collector.on('end', async (collected, reason) => {
                if (reason === 'time') { // Check if the reason is 'time'
                    await interaction.editReply({ content: 'Command time ran out.', components: [], embeds: [], ephemeral: true });
                }
                membersWithoutRole = [];
                membersWithoutRoleId = [];
            });

            collector.on('collect', async i => {
                if (i.customId === 'cancel') {
                    await interaction.editReply({ content: 'The command has been cancelled.', components: [], embeds: [], ephemeral: true }); // Update the message to show cancellation and remove buttons
                    collector.stop('cancelled'); // Stop the collector
                }
                // Check if this is the confirm button
                if (i.customId === 'confirm') {
                    let kickedCount = 0;
                    for (const userId of membersWithoutRoleId) {
                        try {
                            const member = await i.guild.members.fetch(userId);
                            if (member) {
                                await member.kick();
                                kickedCount++;
                            }
                        } catch (error) {
                            console.error("Error kicking member:", error);
                        }
                    }

                    const kickedEmbed = new EmbedBuilder()
                        .setColor(0x0099FF) // You can set the color to whatever you prefer
                        .setTitle(`${serverName} has been saved!`)
                        .setImage('https://i.imgur.com/vpq4fFT.gif')
                        .setDescription(`You made the server cute again.`)
                        .addFields(
                            { name: 'Amount of users kicked:', value: `${kickedCount}` },
                        )

                    // Confirm the action
                    await interaction.editReply({ content: ' ', embeds: [kickedEmbed], components: [], ephemeral: true });
                    collector.stop('confirmed'); // Stop the collector

                    const modBotChannel = interaction.guild.channels.cache.find(channel => channel.name === 'mod-bot' && channel.type === ChannelType.GuildText);
                    if (!modBotChannel) {
                        console.log("Could not find the #mod-bot channel.");
                        return;
                    }

                    // Compose a message about the interaction
                    const interactionInfo = `**${interaction.user.globalName}** (${interaction.user.tag}) used the command '${interaction.commandName}' to kick users. Amount kicked: ${kickedCount}`;
                    // Send the message to the #mod-bot channel
                    await modBotChannel.send({ content: interactionInfo }).catch(console.error);
                }
            });
        } catch (error) {
            console.error("Failed to fetch members or edit reply:", error);
            // Fallback error message to the user
            await interaction.editReply({ content: "An error occurred while processing your request. Please try again later.", ephemeral: true });
        }
    },
};
