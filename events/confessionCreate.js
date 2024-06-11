const { Events, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { replaceTextWithEmojis } = require('../utils/parseEmoji');
const { badWordsMappedSecondary } = require('../blackListMapped');

function censorBadWords(text) {
    let censoredText = text;
    for (let badWord of badWordsMappedSecondary) {
        // Create a regular expression to match the bad word globally and case-insensitively
        let regex = new RegExp(badWord, 'gi');
        censoredText = censoredText.replace(regex, '\\*\\*\\*\\*');
    }
    return censoredText;
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handling chat input commands
        if (!interaction.isModalSubmit()) {
            return;
        }
        if (interaction.customId === 'confessionModal') {
            const input = interaction.fields.getTextInputValue('confessionInput');
            const usernameField = interaction.fields.getTextInputValue('confessionUserNameInput');
            const imageField = interaction.fields.getTextInputValue('imageInput');
            let confession = await replaceTextWithEmojis(input, interaction.guild);
            let userName = 'Anonymous'

            for (let badWord of badWordsMappedSecondary) {
                if (confession.includes(badWord)) {
                    const globalName = interaction.user.globalName;
                    const fluff = `### HEY EVERYONE! It is me, **${globalName}**, and I'm a dumbass who made a confession containing a banned word! Everyone @ my name and laugh at me! Here is also my confession in case I wrote something embarassing: \n\n`
                    const tempConfess = censorBadWords(confession);
                    userName = globalName;
                    confession = fluff + `${tempConfess}`;
                    break;
                }
            }

            if (usernameField) {
                userName = usernameField;
            }

            if (imageField) {
                try {
                    let verifyIsImage = new URL(imageField);
                } catch (error) {
                    await interaction.reply({ content: 'Invalid image URL.', ephemeral: true });
                    return;
                }
            }

            // Specify the ID of the target channel where you want to send the confession
            const targetChannelId = interaction.channelId;
            // Retrieve the channel from the client's channel cache
            const targetChannel = interaction.client.channels.cache.get(targetChannelId);

            const { EmbedBuilder } = require('discord.js');

            const confessionEmbed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle(userName)
                .setDescription(confession)
                .setTimestamp()
                .setThumbnail('https://i.imgur.com/ZIAcuzg.gif');

            if (imageField) {
                confessionEmbed.setImage(imageField)
            }

            if (targetChannel) {
                // Send the confession as a message to the target channel
                await targetChannel.send({ embeds: [confessionEmbed] });
                await interaction.reply({ content: 'Your confession was received and posted!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error processing your confession.', ephemeral: true });
            }

            const filter = i => i.customId === interaction.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter });

            collector.on('collect', async i => {
                if (i.isButton() && i.customId === interaction.id) {
                    const modal = new ModalBuilder()
                        .setCustomId('guessModal')
                        .setTitle('Who made this confession?');

                    // Add components to modal
                    const userNameInput = new TextInputBuilder()
                        .setMaxLength(280)
                        .setMinLength(1)
                        .setRequired(true)
                        .setPlaceholder('Anonymous')
                        .setCustomId('memberInput')
                        .setLabel("Username")
                        // Paragraph means multiple lines of text.
                        .setStyle(TextInputStyle.Short);

                    const firstActionRow = new ActionRowBuilder().addComponents(userNameInput);
                    modal.addComponents(firstActionRow);

                    // Show the modal to the user
                    await i.showModal(modal);
                }
            });
        }
    },
};
