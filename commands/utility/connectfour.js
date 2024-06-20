const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('connectfour')
        .setDescription('Play a game of Connect Four!'),
    async execute(interaction) {
        const board = Array(6).fill(null).map(() => Array(7).fill('⚪')); // Initial empty board

        const message = await interaction.reply({ content: formatBoard(board), fetchReply: true });

        // Add reactions 1 to 7
        const reactions = ['\u0031\uFE0F\u20E3', '\u0032\uFE0F\u20E3', '\u0033\uFE0F\u20E3', '\u0034\uFE0F\u20E3', '\u0035\uFE0F\u20E3', '\u0036\uFE0F\u20E3', '\u0037\uFE0F\u20E3'];
        for (const reaction of reactions) {
            await message.react(reaction);
        }

        // Store the game state
        interaction.client.connectFourGames.set(message.id, {
            board,
            currentPlayer: '🔴', // Starting with red
            playerSides: {}, // Initialize player sides
        });
    },
};

function formatBoard(board) {
    return board.map(row => row.join(' ')).join('\n');
}