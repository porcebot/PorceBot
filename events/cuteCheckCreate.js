const { Events } = require('discord.js');
const { getMessages } = require('../utils/messageCache');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handling chat input commands
        if (!interaction.isUserContextMenuCommand()) {
            return;
        }
        if (interaction.commandName === 'Cute Check') {
            const targetChannelId = interaction.channelId;
            const targetChannel = interaction.client.channels.cache.get(targetChannelId);
            const member = await interaction.guild.members.fetch(interaction.targetId);
            const avatarUrl = member.user.displayAvatarURL({ dynamic: true, size: 128 });
            let cuteScore = 3;
            let cuteMessage = "";
            let cuteHearts = "";

            const cuteKeyWords = [':3', '<3', '~', '^_^', ':D', ':hoonicomfy:', ':plead:', ':hooniawe:', ':mafumafunya:', ':nod:', ':konatayippee:', ':hype:', 'cute', 'meow', 'love', 'comfy']
            const badKeyWords = ['faggot', 'kill', 'its over', 'hangover', ':hoonismug:', 'women', 'woman', 'twinkdeath', 'retard', 'suicid', 'chud']

            try {
                const messages = await getMessages(interaction, targetChannelId)
                const userMessages = messages.filter(m => m.author.id === member.id);
                userMessages.forEach(message => {
                    // Check each keyword in the cuteKeyWords array
                    cuteKeyWords.forEach(keyword => {
                        if (message.content.includes(keyword.toLowerCase())) {
                            cuteScore++; // Increment the cuteScore for each keyword found
                        }
                    });
                    badKeyWords.forEach(keyword => {
                        if (message.content.includes(keyword.toLowerCase())) {
                            cuteScore--; // Decrement the cuteScore for each bad keyword found
                        }
                    });
                });
            } catch (error) {
                await interaction.reply({ content: 'There was an error fetching messages.', ephemeral: true });
                return;
            }

            if (cuteScore <= 0) {
                cuteMessage = "You've been EXTREMELY naughty!";
            } else if (cuteScore >= 5) {
                cuteMessage = "Maximum cuteness overload!";
            } else {
                // Handle cases from 1 to 4
                switch (cuteScore) {
                    case 1:
                        cuteMessage = "You've been naughty!";
                        break;
                    case 2:
                        cuteMessage = "Not quite cute!";
                        break;
                    case 3:
                        cuteMessage = "Just a little bit cute!";
                        break;
                    case 4:
                        cuteMessage = "Wow, aren't you just cute!";
                        break;
                    // No need for a default case since all possibilities are covered
                }
            }

            // Ensure cuteScore is within the 0 to 5 range in case it reaches negative or above 5
            cuteScore = Math.max(0, Math.min(cuteScore, 5));

            // Add red hearts for the score
            for (let i = 0; i < cuteScore; i++) {
                cuteHearts += "❤️";
            }

            // Add a black heart if the score is less than 5
            for (let i = cuteScore; i < 5; i++) {
                cuteHearts += "🖤";
            }

            const { EmbedBuilder } = require('discord.js');

            const confessionEmbed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle('Cute Check 🤖')
                .setDescription(`${member}\n*Your messages in this channel have been analyzed...* \n\nYour score: **${cuteScore}**\n ${cuteHearts}\n\n **${cuteMessage}**`)
                .setTimestamp()
                .setImage(avatarUrl);

            if (targetChannel) {
                // Send the confession as a message to the target channel
                await targetChannel.send({ embeds: [confessionEmbed] });
                await interaction.reply({ content: 'Your messages have been analyzed!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error processing your command.', ephemeral: true });
            }
        }
    },
};