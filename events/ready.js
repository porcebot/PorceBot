const { Events } = require('discord.js');

let botInfo = {};

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        // Save the bot's username and ID
        botInfo.username = client.user.username;
        botInfo.id = client.user.id;
    },
    getBotInfo() {
        return botInfo;
    }
};