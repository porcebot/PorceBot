const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = {
    name: Events.MessageCreate,
    async execute(interaction) {
        if (interaction.author.bot) return; // Ignore bot messages
        if (!interaction.guild) return; // Ignore DMs
        if (interaction.attachments.size < 1) return; // attachments only
        const attachment = interaction.attachments.first();
        if (attachment.contentType != 'video/webm') return; // webms only

        const tempDir = path.join(__dirname, '..', 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        const inputPath = path.join(tempDir, attachment.name);
        const outputPath = inputPath.replace('.webm', '.mp4');
        const response = await fetch(attachment.url);
        const fileStream = fs.createWriteStream(inputPath);
        response.body.pipe(fileStream);

        fileStream.on('finish', () => {
            ffmpeg(inputPath)
                .toFormat('mp4')
                .on('end', async () => {
                    await interaction.reply({ content: `Here's an MP4 for iGods:`, files: [outputPath] });
                    fs.unlinkSync(inputPath);
                    fs.unlinkSync(outputPath);
                })
                .on('error', async (err) => {
                    console.error(err);
                    fs.unlinkSync(inputPath);
                })
                .save(outputPath);
        });

        fileStream.on('error', async (err) => {
            console.error(err);
            fs.unlinkSync(inputPath);
        });

    },
};
