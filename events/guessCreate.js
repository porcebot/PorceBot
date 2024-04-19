const { Events, EmbedBuilder } = require('discord.js');

const guessesPerMessage = new Map();

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isModalSubmit()) {
            return;
        }
        if (interaction.customId === 'guessModal') {

            const userId = interaction.user.id;
            const messageId = interaction.message.id;

            // Retrieve or initialize the set of user IDs who have guessed on this message
            if (!guessesPerMessage.has(messageId)) {
                guessesPerMessage.set(messageId, new Set());
            }
            const userSet = guessesPerMessage.get(messageId);

            // Check if this user has already guessed
            if (userSet.has(userId)) {
                await interaction.reply({ content: 'You have already made a guess for this confession!', ephemeral: true });
                return; // Prevent further processing
            }

            try {
                const userInput = interaction.fields.getTextInputValue('memberInput');
                const guild = interaction.guild;

                // Validate the user input against guild member names
                const members = await guild.members.fetch();
                const memberMatch = members.find(member =>
                    member.user.username === userInput ||
                    (member.nickname && member.nickname === userInput));

                if (!memberMatch) {
                    await interaction.reply({ content: 'No member found with that name. Please try again.', ephemeral: true });
                    return;
                }
                await interaction.deferReply({ ephemeral: true });

                const messageId = interaction.message.id;
                const originalMessage = await interaction.channel.messages.fetch(messageId);

                // Retrieve the existing footer, if it exists
                const existingFooter = originalMessage.embeds[0].footer ? originalMessage.embeds[0].footer.text : '';
                const guessMap = parseFooter(existingFooter);
                // Update the guess count for the new input
                if (guessMap[userInput]) {
                    guessMap[userInput]++;
                } else {
                    guessMap[userInput] = 1;
                }

                // Sort guesses by count and format for the footer
                const sortedFooterText = formatGuesses(guessMap);

                const newEmbed = EmbedBuilder.from(originalMessage.embeds[0])
                    .setFooter({ text: sortedFooterText, iconURL: 'https://i.imgur.com/U636KHq.png' });

                await originalMessage.edit({ embeds: [newEmbed] });
                await interaction.editReply({ content: 'Your guess has been recorded!' });
                // Record this user's guess
                userSet.add(userId);
            } catch (error) {
                console.error('Error:', error);
                await interaction.editReply({ content: 'Failed to process your guess. Please try again.' });
            }
        }
    },
};

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
