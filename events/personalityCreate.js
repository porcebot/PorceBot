const { Events } = require('discord.js');
const path = require('path');
const fs = require('fs');
const filePath = path.join(__dirname, '..', 'data', 'personalityTraits.json');

function readPersonalityTraits() {
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    }
    return {};
}

function writePersonalityTraits(traits) {
    fs.writeFileSync(filePath, JSON.stringify(traits, null, 2), 'utf-8');
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handling chat input commands
        if (!interaction.isModalSubmit()) {
            return;
        }
        if (interaction.customId === 'setpersonality') {
            const description = interaction.fields.getTextInputValue('description');
            const userId = interaction.user.id;

            const personalityTraits = readPersonalityTraits();
            const displayName = interaction.member.displayName;

            personalityTraits[userId] = {
                name: displayName,
                traits: description
            };

            writePersonalityTraits(personalityTraits);
            await interaction.reply({ content: 'Your personality description has been saved!', ephemeral: true });
        }
        if (interaction.customId === 'setpersonalityothers') {
            const description = interaction.fields.getTextInputValue('description');
            const userId = interaction.fields.getTextInputValue('id');
            const guildMember = await interaction.guild.members.fetch(userId);

            const personalityTraits = readPersonalityTraits();
            const displayName = guildMember.displayName;

            personalityTraits[userId] = {
                name: displayName,
                traits: description
            };

            writePersonalityTraits(personalityTraits);
            await interaction.reply({ content: 'Their personality description has been saved!', ephemeral: true });
        }
    },
};
