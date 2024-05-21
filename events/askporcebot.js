const { Events } = require('discord.js');
const { OpenAI } = require('openai');

let lastCommandTime = 0;
const cooldownDuration = 10000;
const ARR_MAX_LENGTH = 7; // Equals to 1 system message, 3 user messages and 3 assistant messages

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const systemMessage = {
    role: 'system',
    content:
        ``
};

let conversationArray = [];

function includeSystemMessage() {
    if (!conversationArray.some(msg => msg.role === 'system')) {
        conversationArray.unshift(systemMessage);
    }
}

function addMessage(role, content) {
    // Check array size and shift if necessary
    if (conversationArray.length >= ARR_MAX_LENGTH) {
        // Remove the second element in the array (index 1), which is the oldest message after the system message
        conversationArray.splice(1, 1);
    }
    // Add new message at the end of the array
    conversationArray.push({ role: role, content: content });
}

function splitMessage(text, maxLength = 2000) {
    const lines = text.split('\n');
    const chunks = [];
    let chunk = '';

    for (const line of lines) {
        if (chunk.length + line.length + 1 > maxLength) {
            chunks.push(chunk);
            chunk = '';
        }
        chunk += line + '\n';
    }

    chunks.push(chunk);
    return chunks;
}

module.exports = {
    name: Events.MessageCreate,
    async execute(interaction) {
        if (interaction.author.bot) return;
        const botMentioned = interaction.mentions.has(interaction.client.user);
        const repliedToBot = interaction.reference && (await interaction.channel.messages.fetch(interaction.reference.messageId)).author.id === interaction.client.user.id;
        if (!botMentioned && !repliedToBot) return;
        const prompt = botMentioned ? interaction.content.replace(`<@${interaction.client.user.id}>`, '').trim() : interaction.content;
        if (!prompt) return;

        try {
            await interaction.channel.sendTyping();
            const currentTime = Date.now();
            if (currentTime - lastCommandTime < cooldownDuration) {
                const timeLeft = Math.ceil((cooldownDuration - (currentTime - lastCommandTime)) / 1000); // Time remaining in seconds
                await interaction.reply({ content: `Mr. PorceBot is not in the mood right now! Please wait ${timeLeft} seconds.`, ephemeral: true }).catch(console.error);
                return;
            }
            lastCommandTime = currentTime;

            includeSystemMessage() // ensure system message is included in prompt
            addMessage('user', prompt); // add user message to prompt

            const response = await openai.chat.completions.create({
                model: "gpt-4-turbo",
                messages: conversationArray,
                temperature: 1.15,
                max_tokens: 512,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
            });

            if (!response || !response.choices[0]) {
                await interaction.reply(`Erm... I can't answer right now, please try again later!<3`).catch(console.error);
            }
            const botMessage = response.choices[0].message.content;
            addMessage('assistant', botMessage); // add bot message for future prompts
            const chunks = splitMessage(botMessage);

            for (const chunk of chunks) {
                await interaction.reply(chunk).catch(console.error); // Finally, send message on Discord
            }
        } catch (error) {
            console.error('Error occurred:', error);
        }
    },
};
