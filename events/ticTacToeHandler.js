// events/ticTacToeHandler.js
const { Events, ButtonInteraction, EmbedBuilder } = require('discord.js');

let board = Array(9).fill(null);
let currentPlayer = 'X';
let moves = [];

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton() || !interaction.customId.match(/^\d+$/)) return;


        const index = parseInt(interaction.customId);
        if (board[index] !== null) {
            await interaction.reply({ content: 'Invalid move!', ephemeral: true });
            return;
        }

        const move = {
            player: interaction.member.toString(),
            position: `${['A', 'B', 'C'][index % 3]}${['1', '2', '3'][Math.floor(index / 3)]}`
        };
        moves.push({ ...move, player: interaction.member.toString() });

        board[index] = currentPlayer;
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';

        let status = 'Game in progress.';

        if (checkWin(board)) {
            status = `**Player ${board[index]} wins!**`;
            await interaction.update({ embeds: [createEmbed(moves, status)], components: createBoard(board, true) });
            resetBoard();
        } else if (board.every(cell => cell !== null)) {
            status = '**It\'s a tie!**';
            await interaction.update({ embeds: [createEmbed(moves, status)], components: createBoard(board, true) });
            resetBoard();
        } else {
            await interaction.update({ embeds: [createEmbed(moves, status)], components: createBoard(board) });
        }
    },
};

function checkWin(board) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]  // Diagonals
    ];
    return winPatterns.some(pattern =>
        board[pattern[0]] !== null &&
        board[pattern[0]] === board[pattern[1]] &&
        board[pattern[1]] === board[pattern[2]]
    );
}

function resetBoard() {
    board = Array(9).fill(null);
    currentPlayer = 'X';
    moves = [];
}

function createEmbed(moves, status) {
    const embed = new EmbedBuilder()
        .setTitle('Tic Tac Toe')
        .setDescription(status)
        .addFields({
            name: 'Moves',
            value: moves.length > 0 ? moves.map(move => `${move.position} ${move.player}`).join('\n') : 'No moves made yet.',
            inline: false
        });
    return embed;
}


function createBoard(board, disableButtons = false) {
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    const rows = [];
    for (let i = 0; i < 3; i++) {
        const row = new ActionRowBuilder();
        for (let j = 0; j < 3; j++) {
            const label = board[i * 3 + j];
            const style = label === 'X' ? ButtonStyle.Danger :
                label === 'O' ? ButtonStyle.Primary :
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
