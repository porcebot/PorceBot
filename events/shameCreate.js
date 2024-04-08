const { Events, ActionRowBuilder, ChannelType, EmbedBuilder, TextInputBuilder, TextInputStyle, ModalBuilder } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Check if it is a user context menu command
        if (interaction.isUserContextMenuCommand() && interaction.commandName === 'Boycourt') {

            const targetId = interaction.targetId

            const targetUser = await interaction.guild.members.fetch(interaction.targetId).catch(console.error);
            const userName = targetUser.user.username;

            const modal = new ModalBuilder()
                .setCustomId('shameModal')
                .setTitle('Boycourt Tribunal');

            const explanationInput = new TextInputBuilder()
                .setMaxLength(1000)
                .setMinLength(1)
                .setPlaceholder(`He's fat and ugly!`)
                .setRequired(true)
                .setCustomId('shameInput')
                .setLabel("What has this person done?")
                .setStyle(TextInputStyle.Paragraph);
            const userNameInput = new TextInputBuilder()
                .setMaxLength(32)
                .setMinLength(2)
                .setRequired(true)
                .setPlaceholder('User ID')
                .setLabel("Username")
                .setValue(userName)
                .setCustomId('shameInputUserName')
                .setStyle(TextInputStyle.Short);
            const userIdInput = new TextInputBuilder()
                .setMaxLength(30)
                .setMinLength(1)
                .setRequired(true)
                .setPlaceholder('User ID')
                .setLabel("User ID")
                .setValue(targetId)
                .setCustomId('shameInputUserId')
                .setStyle(TextInputStyle.Short);

            const firstActionRow = new ActionRowBuilder().addComponents(explanationInput);
            const secondActionRow = new ActionRowBuilder().addComponents(userNameInput);
            const thirdActionRow = new ActionRowBuilder().addComponents(userIdInput);
            modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
            await interaction.showModal(modal);

        } else if (interaction.isModalSubmit() && interaction.customId === 'shameModal') {
            const input = interaction.fields.getTextInputValue('shameInput');
            const userName = interaction.fields.getTextInputValue('shameInputUserName');
            const userId = interaction.fields.getTextInputValue('shameInputUserId');
            const targetChannel = interaction.guild.channels.cache.find(channel => channel.name === 'boycourt' && channel.type === ChannelType.GuildText);
            const mentionString = `<@${userId}>`; // This creates a mention string for the user
            const roleName = "Boyjury";
            const role = interaction.guild.roles.cache.find(r => r.name === roleName);
            const roleId = role.id;
            const mention = `<@&${roleId}>`;

            try {
                const member = await interaction.guild.members.fetch(userId); // Verify ID exists
            } catch (error) {
                await interaction.reply({ content: 'Incorrect ID. Please do not modify the ID field.', ephemeral: true });
                return;
            }

            const confessionEmbed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle(`${userName} has been indicted!`) // Use displayName for a cleaner title
                .setAuthor({ name: "Boycourt Tribunal", iconURL: 'https://i.imgur.com/AEFX07E.png', url: 'https://i.imgur.com/AEFX07E.png' })
                .setDescription(input)
                .setTimestamp()
                .setImage('https://i.imgur.com/guXO4k2.png');

            if (targetChannel && role) {
                const interactionInfo = `You have been indicted, ${mentionString}! It is the duty of the ${mention} to assess the evidence presented to determine the guilt or innocence of the accused. React with 👍🏻 if the accused is guilty or 👎🏻 if innocent.`;
                await targetChannel.send({ embeds: [confessionEmbed], content: interactionInfo })
                    .then(message => {
                        message.react('👍🏻');
                        message.react('👎🏻');
                    })
                    .catch(console.error);
                await interaction.reply({ content: 'Your report was received and posted!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error processing your report.', ephemeral: true });
            }
        }
    },
};
