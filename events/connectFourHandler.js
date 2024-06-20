const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {
        // Ignore bot reactions
        if (user.bot) return;

        // Fetch the game state
        const game = reaction.client.connectFourGames.get(reaction.message.id);
        if (!game) return; // No game state found

        const col = ['\u0031\uFE0F\u20E3', '\u0032\uFE0F\u20E3', '\u0033\uFE0F\u20E3', '\u0034\uFE0F\u20E3', '\u0035\uFE0F\u20E3', '\u0036\uFE0F\u20E3', '\u0037\uFE0F\u20E3'].indexOf(reaction.emoji.name);
        if (col === -1) return; // Invalid reaction

        const userId = user.id;

        // Check if the player is making their first move
        if (!game.playerSides[userId]) {
            if (Object.keys(game.playerSides).length >= 2) {
                await reaction.message.channel.send(`${user}, only two players can play at a time!`).then(msg => setTimeout(() => msg.delete(), 5000));
                reaction.users.remove(user); // Remove the player's reaction
                return;
            }
            game.playerSides[userId] = game.currentPlayer; // Assign the current side to the player
            game.players[game.currentPlayer] = user; // Track the player

            // Update the message to show the current player's turn if both players have joined
            if (Object.keys(game.playerSides).length === 2) {
                await updateGameStatus(reaction.message, game);
            }
        }

        // Check if the player is trying to play on the correct side
        if (game.playerSides[userId] !== game.currentPlayer) {
            await reaction.message.channel.send(`${user}, you can only play as ${game.playerSides[userId]}!`).then(msg => setTimeout(() => msg.delete(), 5000));
            reaction.users.remove(user); // Remove the player's reaction
            return;
        }

        // Find the lowest empty spot in the column
        const board = game.board;
        let placeRow = -1;
        for (let i = 5; i >= 0; i--) {
            if (board[i][col] === '⚪') {
                placeRow = i;
                break;
            }
        }
        if (placeRow === -1) {
            reaction.message.channel.send(`${user}, this column is full!`).then(msg => setTimeout(() => msg.delete(), 5000));
            reaction.users.remove(user); // Remove the player's reaction
            return;
        }

        // Place the piece
        board[placeRow][col] = game.currentPlayer;
        game.currentPlayer = game.currentPlayer === '🔴' ? '🟡' : '🔴';

        // Update the message
        await updateGameStatus(reaction.message, game);
        reaction.users.remove(user);

        // Check for a win
        if (checkWin(board, placeRow, col)) {
            await reaction.message.edit(`${formatBoard(board)}\n${user} wins!`);
            reaction.client.connectFourGames.delete(reaction.message.id);
        } else if (board.every(row => row.every(cell => cell !== '⚪'))) {
            await reaction.message.edit(`${formatBoard(board)}\nIt's a tie!`);
            reaction.client.connectFourGames.delete(reaction.message.id);
        }
    },
};

function formatBoard(board) {
    return board.map(row => row.join(' ')).join('\n');
}

function checkWin(board, row, col) {
    const directions = [
        { x: 0, y: 1 },  // Vertical
        { x: 1, y: 0 },  // Horizontal
        { x: 1, y: 1 },  // Diagonal /
        { x: 1, y: -1 }  // Diagonal \
    ];

    const player = board[row][col];

    for (const { x, y } of directions) {
        let count = 1;

        for (let i = 1; i < 4; i++) {
            const r = row + y * i;
            const c = col + x * i;
            if (r >= 0 && r < 6 && c >= 0 && c < 7 && board[r][c] === player) {
                count++;
            } else {
                break;
            }
        }

        for (let i = 1; i < 4; i++) {
            const r = row - y * i;
            const c = col - x * i;
            if (r >= 0 && r < 6 && c >= 0 && c < 7 && board[r][c] === player) {
                count++;
            } else {
                break;
            }
        }

        if (count >= 4) {
            return true;
        }
    }

    return false;
}

async function updateGameStatus(message, game) {
    const currentPlayer = game.currentPlayer;
    const currentPlayerUser = game.players[currentPlayer];
    const status = currentPlayerUser ? `**Next up: ${currentPlayer} ${currentPlayerUser}**\n\n` : '**Game Start**\n\n';
    await message.edit(status + formatBoard(game.board));
}