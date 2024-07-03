const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const path = require('path');
const fs = require('fs');
const filePath = path.join(__dirname, '..', '..', 'data', 'systemPrompt.json');

function readSystemPrompt() {
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
        .setName('systemprompt')
        .setDescription('Read the system prompt of the ChatGPT bot.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false }).catch(console.error);

        const botUserId = interaction.client.user.id;
        const guildMember = await interaction.guild.members.fetch(botUserId);
        const displayName = guildMember.displayName;
        const systemPrompt = readSystemPrompt();

        const embed = new EmbedBuilder()
            .setTitle(`${displayName}'s GPT system prompt`)
            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
            .setColor(0x00AE86);

        if (systemPrompt) {
            embed.setDescription(`${formatTraits(systemPrompt.content)}`);
        } else {
            embed.setDescription(`No system prompt found for ${displayName}.`);
        }

        await interaction.editReply({ embeds: [embed], ephemeral: false });
    },

};
