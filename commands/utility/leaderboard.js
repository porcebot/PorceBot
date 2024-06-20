const { SlashCommandBuilder } = require('discord.js');
const { readLeaderboard } = require('../../utils/jsonUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Display the Connect Four leaderboard.'),
    async execute(interaction) {
        const leaderboard = await readLeaderboard();
        const sortedLeaderboard = Object.values(leaderboard).sort((a, b) => b.wins - a.wins);
        const leaderboardText = sortedLeaderboard.map((entry, index) => `${index + 1}. ${entry.username}: ${entry.wins} wins ${entry.losses} losses`).join('\n');

        await interaction.reply(`**Connect Four Leaderboard**\n\n${leaderboardText}`);
    },
};