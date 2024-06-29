const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: Events.MessageCreate,
    async execute(interaction) {
        if (interaction.author.bot) return; // Ignore bot messages
        if (!interaction.guild) return; // Ignore DMs
        const channelName = interaction.channel.name;
        if (channelName !== 'floppers') return; // Only act in 'floppers' channel

        const gifUrl = 'https://tenor.com/view/silly-cat-cadet-floopers-9000-floppers-sir-yes-sir-gif-3623413836398855336';

        const messageContainsGif = interaction.content.includes(gifUrl);

        if (!messageContainsGif) return; // Only act if the message contains the specific GIF URL

        const filePath = path.join(__dirname, '..', 'data', 'floppers.json');

        // Ensure the data directory exists
        const dataDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }

        // Check if the file exists
        if (!fs.existsSync(filePath)) {
            // If it doesn't exist, create it with the initial value 9000
            fs.writeFileSync(filePath, JSON.stringify({ count: 9000 }, null, 2));
        }

        // Read the file
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileContent);

        // Deduce 1 from the current number
        let currentCount = data.count;
        currentCount -= 1;

        // Save the new number back to the file
        fs.writeFileSync(filePath, JSON.stringify({ count: currentCount }, null, 2));

        // Send a message in the channel

        if (currentCount > 0) {
            await interaction.channel.send(`Well done, cadet! You have ${currentCount} number of floppers to go!`);
        } else {
            await interaction.channel.send(`That's enough floppers, soldier! Here, have a can of tuna! 🥫`);
        }
    },
};
