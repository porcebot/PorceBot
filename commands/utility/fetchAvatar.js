const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fetchavatars')
        .setDescription('Fetches avatar URLs of all users in the server and sends a zip file of avatars.')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
        // Ensure the interaction is deferred as fetching all members can take time
        await interaction.deferReply();

        // Fetch all members of the guild
        const members = await interaction.guild.members.fetch();

        // Create a temporary directory to store avatar images
        const tempDir = path.join(__dirname, 'temp');
        await fs.ensureDir(tempDir);

        // Download each avatar and save it to the temporary directory
        const downloadPromises = members.map(async member => {
            const avatarUrl = member.user.displayAvatarURL({ format: 'png', size: 1024 });
            const filePath = path.join(tempDir, `${member.user.tag}.png`);
            const response = await axios.get(avatarUrl, { responseType: 'stream' });
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);
            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        });

        await Promise.all(downloadPromises);

        // Create a zip file of the avatars
        const zipPath = path.join(__dirname, 'avatars.zip');
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', async () => {
            // Send the zip file in the chat
            await interaction.followUp({ files: [zipPath] });

            // Clean up the temporary files
            await fs.remove(tempDir);
            await fs.remove(zipPath);
        });

        archive.on('error', err => { throw err; });

        archive.pipe(output);

        archive.directory(tempDir, false);

        await archive.finalize();
    },
};
