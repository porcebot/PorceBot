const fs = require('fs').promises;
const path = require('path');

const leaderboardFilePath = path.resolve(__dirname, '../data/leaderboard.json');

async function readLeaderboard() {
    try {
        const data = await fs.readFile(leaderboardFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // If the file doesn't exist, create the directory and file, and return an empty object
            await createFileWithEmptyObject(leaderboardFilePath);
            return {};
        } else {
            throw error;
        }
    }
}

async function writeLeaderboard(leaderboard) {
    const data = JSON.stringify(leaderboard, null, 2);
    await fs.writeFile(leaderboardFilePath, data, 'utf8');
}

async function createFileWithEmptyObject(filePath) {
    const dirPath = path.dirname(filePath);
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify({}, null, 2), 'utf8');
}

module.exports = {
    readLeaderboard,
    writeLeaderboard,
};
