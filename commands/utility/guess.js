const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');

function truncateString(str, maxLength) {
    return str.length > maxLength ? `${str.substring(0, maxLength - 3)}...` : str;
}

function parseFooter(footerText) {
    const guessMap = {};
    if (footerText.trim() === '') return guessMap; // Early exit if footer is empty

    const guesses = footerText.split(', ');
    guesses.forEach(guess => {
        const parts = guess.split('x ');
        if (parts.length === 2 && !isNaN(parseInt(parts[0], 10))) {
            const count = parseInt(parts[0], 10);
            const name = parts[1].trim();
            if (name) { // Ensure the name part is not empty
                guessMap[name] = count;
            }
        } else if (parts.length === 1) {
            // Handle the case where no "x" is included, typical for initial guesses
            const name = parts[0].trim();
            if (name in guessMap) {
                guessMap[name]++;
            } else {
                guessMap[name] = 1;
            }
        }
    });
    return guessMap;
}

function formatGuesses(guessMap) {
    const sortedGuesses = Object.entries(guessMap).sort((a, b) => b[1] - a[1]); // Sort by count descending
    return sortedGuesses.map(([name, count]) => `${count}x ${name}`).join(', ');
}

const guessesPerMessage = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guess')
        .setDescription('Guess who made a confession!')
        .addUserOption(option =>
            option.setName('user')
                .setRequired(true)
                .setDescription('Pick a user')),

    async execute(interaction) {
        const selectedUser = interaction.options.getUser('user');
        let fetched = await interaction.channel.messages.fetch({ limit: 25 });
        let botMessages = fetched.filter(m => m.author.bot);
        let confessionMessages = botMessages.filter(m =>
            m.embeds.some(embed => embed.data.type === "rich")
        );

        const confessionSelect = new StringSelectMenuBuilder()
            .setCustomId('confessionSelect')
            .setPlaceholder('Select a confession.')
            .addOptions(
                confessionMessages.map(message => {
                    // Ensure there is at least one embed and use its description or provide default text
                    const description = message.embeds.length > 0 ? message.embeds[0].description || 'No Description Available' : 'No Embed Present';
                    return {
                        label: truncateString(description, 100),
                        value: message.id
                    };
                })
            );

        const newGuessRow = new ActionRowBuilder().addComponents(confessionSelect);

        // Respond or update the interaction
        await interaction.reply({
            content: `Which message belongs to ${selectedUser}?`,
            components: [newGuessRow],
            ephemeral: true // This menu is only visible to the user
        });

        const filter = i => i.customId === 'confessionSelect';
        const collector = interaction.channel.createMessageComponentCollector({ filter });

        collector.on('collect', async i => {
            if (i.customId === 'confessionSelect') {
                const messageId = i.values[0];
                const displayName = selectedUser.globalName;

                if (!guessesPerMessage.has(messageId)) {
                    guessesPerMessage.set(messageId, new Set());
                }
                const userSet = guessesPerMessage.get(messageId);

                // Check if this user has already guessed
                if (userSet.has(selectedUser.id)) {
                    await interaction.editReply({ content: 'You have already made a guess for this confession!', components: [], ephemeral: true });
                    return; // Prevent further processing
                }

                try {
                    const originalMessage = await interaction.channel.messages.fetch(messageId);

                    // Retrieve the existing footer, if it exists
                    const existingFooter = originalMessage.embeds[0].footer ? originalMessage.embeds[0].footer.text : '';
                    const guessMap = parseFooter(existingFooter);
                    // Update the guess count for the new input
                    if (guessMap[displayName]) {
                        guessMap[displayName]++;
                    } else {
                        guessMap[displayName] = 1;
                    }

                    // Sort guesses by count and format for the footer
                    const sortedFooterText = formatGuesses(guessMap);

                    const newEmbed = EmbedBuilder.from(originalMessage.embeds[0])
                        .setFooter({ text: sortedFooterText, iconURL: 'https://i.imgur.com/U636KHq.png' });

                    await originalMessage.edit({ embeds: [newEmbed] });
                    await interaction.editReply({ content: 'Your guess has been recorded!', components: [], ephemeral: true });
                    // Record this user's guess
                    userSet.add(selectedUser.id);
                } catch (error) {
                    console.log(error)
                    await interaction.editReply({ content: 'Failed to process your guess. Please try again.', components: [], ephemeral: true });
                }
            }
        });
    },
};