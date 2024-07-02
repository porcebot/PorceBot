const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const filePath = path.join(__dirname, '..', '..', 'data', 'personalityTraits.json');

function readPersonalityTraits() {
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    }
    return {};
}

function formatTraits(traits) {
    return JSON.stringify(traits, null, 2);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('personality')
        .setDescription('Read personality of users set in ChatGPT conversations.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Select a user to view their personality')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false }).catch(console.error);

        const targetUser = interaction.options.getUser('target');
        const guildMember = await interaction.guild.members.fetch(targetUser.id);
        const displayName = guildMember.displayName;
        const userId = targetUser.id;
        const personalityTraits = readPersonalityTraits();

        const embed = new EmbedBuilder()
            .setTitle(`${displayName}'s personality`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setColor(0x00AE86);

        if (personalityTraits[userId]) {
            const userTraits = personalityTraits[userId];
            embed.setDescription(`${formatTraits(userTraits.traits)}`);
        } else {
            embed.setDescription(`No personality found for ${displayName}.`);
        }

        await interaction.editReply({ embeds: [embed], ephemeral: false });
    },

};
