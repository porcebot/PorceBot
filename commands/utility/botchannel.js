const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const filePath = './channelData.json';
const writeFileAtomic = require('write-file-atomic');

async function saveChannelData(data) {
    try {
        await writeFileAtomic(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error writing file:', error);
    }
}

async function setChannelData(channelId, channelName) {
    const channelsList = loadChannelData();

    if (channelsList[channelId]) {
        channelsList[channelId].name = channelName;
    } else {
        // Add new channel
        channelsList[channelId] = {
            name: channelName,
        };
    }
    await saveChannelData(channelsList);
}

async function loadChannelData() {
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    }
    return {};
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gptchannel')
        .setDescription('Set the channel to be used for GPT commands.')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addStringOption(option =>
            option.setName('channel')
                .setRequired(true)
                .setDescription('Type the name of the channel.')),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false }).catch(console.error);
        const guild = interaction.guild;
        const channels = guild.channels.cache;
        const textChannels = channels.filter(channel => channel.type === 0);
        const option = interaction.options.getString('channel');
        const selectedChannel = textChannels.find(channel => channel.name === option);

        if (!selectedChannel) {
            interaction.editReply({ content: `"${option}" was not found. Please double check the channel name.` });
            return;
        }

        try {
            await setChannelData(selectedChannel.id, selectedChannel.name);
            const savedChannelDetails = await loadChannelData();
            let embedDescription = '';
            Object.values(savedChannelDetails).forEach(value => {
                embedDescription += value.name + '\n';
            });
            const channelListEmbed = new EmbedBuilder()
                .setTitle(`Text Channel *${option}* saved successfully.`)
                .setDescription(`Current list of channels: ${embedDescription}`);
            interaction.editReply({ embeds: [channelListEmbed] });
        } catch (error) {
            interaction.editReply({ content: `Error occurred: ${error}` });
        }
    }
};
