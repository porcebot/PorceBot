const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const configFilePath = path.join(__dirname, '..', '..', 'data', 'commandConfig.json');
const config = require(configFilePath);

// Extract the command name
const commandName = config.commandName;
const commandDescription = config.commandDescription;
const commandTarget = config.commandTarget;

module.exports = {
    data: new SlashCommandBuilder()
        .setName(commandName)
        .setDescription(commandDescription)
        .addUserOption(option => option.setName('target').setDescription(commandTarget).setRequired(true)),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('target');
        const huggingUser = interaction.user;

        if (targetUser.id === huggingUser.id) {
            await interaction.reply({ content: "You cannot do that to yourself!", ephemeral: true });
            return;
        }

        // Get the display names
        const targetMember = await interaction.guild.members.fetch(targetUser.id);
        const huggingMember = await interaction.guild.members.fetch(huggingUser.id);
        const targetDisplayName = targetMember.displayName;
        const targetDisplayNameTag = `<@${targetMember.id}>`;
        const huggingDisplayNameTag = `<@${huggingMember.id}>`;

        // Read the current hug counts from the JSON file

        const filePath = path.join(__dirname, '..', '..', 'data', 'hugCounts.json');
        const promptsFilePath = path.join(__dirname, '..', '..', 'data', 'prompts.json');
        let hugCounts = {};

        if (fs.existsSync(filePath)) {
            const rawData = fs.readFileSync(filePath);
            hugCounts = JSON.parse(rawData);
        }

        // Update the hug count
        const targetUserId = targetUser.id;
        if (!hugCounts[targetUserId]) {
            hugCounts[targetUserId] = 0;
        }
        hugCounts[targetUserId]++;

        // Save the updated hug counts back to the JSON file
        fs.writeFileSync(filePath, JSON.stringify(hugCounts, null, 4));

        let prompts = [];
        if (fs.existsSync(promptsFilePath)) {
            const rawData = fs.readFileSync(promptsFilePath);
            prompts = JSON.parse(rawData);
        }
        const randomGifPrompts = prompts.gifs;
        const randomGif = randomGifPrompts[Math.floor(Math.random() * randomGifPrompts.length)];
        const titlePrompts = prompts.title;
        const randomTitlePrompt = titlePrompts[Math.floor(Math.random() * titlePrompts.length)];
        const title = randomTitlePrompt
            .replace('{target}', targetDisplayName)
            .replace('{amount}', hugCounts[targetUserId]);
        const hugPrompts = prompts.hugs;
        const randomPromptTemplate = hugPrompts[Math.floor(Math.random() * hugPrompts.length)];
        const randomPrompt = randomPromptTemplate
            .replace('{hugger}', targetDisplayNameTag)
            .replace('{target}', huggingDisplayNameTag)
            .replace('{amount}', hugCounts[targetUserId]);

        // Create the embed message
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(randomPrompt)
            .setImage(randomGif) // Example GIF URL
            .setColor(0x0099ff)

        // Send the embed message as a reply
        await interaction.reply({ embeds: [embed] });
    },
};
