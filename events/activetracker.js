const { Events } = require('discord.js');
const fs = require('fs');

const activeUsersMap = new Map();
let lastWrittenUserId;
let lastExecutedMessageRead = 0;
let lastExecutedFileWrite = 0;
const throttleTimeMessages = 2000; // 2 seconds
const throttleTimeFileWrite = 1000 * 60 * 5; // 5 minutes

function saveActiveUsersToFile() {
    const data = JSON.stringify(Array.from(activeUsersMap.entries()));
    fs.writeFileSync('activeUsers.json', data);
}

module.exports = {
    name: Events.MessageCreate,
    activeUsersMap,
    async execute(interaction) {
        if (interaction.author.bot) return; // Ignore bot messages
        if (!interaction.guild) return; // Ignore DMs

        const userId = interaction.author.id;
        if (lastWrittenUserId === userId) return; // Save resources by ignoring multiple messages from same user

        const executedNow = Date.now();
        if (executedNow - lastExecutedMessageRead < throttleTimeMessages) return; // Throttle to read messages in 2 second intervals
        lastExecutedMessageRead = executedNow; // Set last executed message window

        activeUsersMap.set(userId, executedNow); // Update the user's last activity timestamp to an in-memory map
        lastWrittenUserId = userId;

        if (executedNow - lastExecutedFileWrite < throttleTimeFileWrite) return; // Throttle to write to file in 5 minute intervals
        lastExecutedFileWrite = executedNow; // Set last executed file write window
        saveActiveUsersToFile(); // Save the map to file
    },
};