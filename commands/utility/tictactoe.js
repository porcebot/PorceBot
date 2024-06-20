// commands/fun/tictactoe.js
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tictactoe')
        .setDescription('Play a game of Tic Tac Toe!'),
    async execute(interaction) {
        const board = Array(9).fill(null); // Initial empty board
        const moves = [];
        const embed = createEmbed(moves);
        await interaction.reply({ embeds: [embed], components: createBoard(board) });
    },
};

function createEmbed(moves) {
    const embed = new EmbedBuilder()
        .setTitle('Tic Tac Toe')
        .setDescription('Game started! Make your moves.')
        .addFields(moves.map((move, index) => ({
            name: `Move ${index + 1}`,
            value: `${move.player} moved to ${move.position}`,
            inline: true
        })));
    return embed;
}

function createBoard(board, disableButtons = false) {
    const rows = [];
    for (let i = 0; i < 3; i++) {
        const row = new ActionRowBuilder();
        for (let j = 0; j < 3; j++) {
            const label = board[i * 3 + j];
            const style = label === 'X' ? ButtonStyle.Primary :
                label === 'O' ? ButtonStyle.Danger :
                    ButtonStyle.Secondary;
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`${i * 3 + j}`)
                    .setLabel(label || '\u200b') // Use zero-width space for empty cells
                    .setStyle(style)
                    .setDisabled(disableButtons)
            );
        }
        rows.push(row);
    }
    return rows;
}
