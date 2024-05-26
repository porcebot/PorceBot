const { Events } = require('discord.js');
const { OpenAI } = require('openai');
const { systemMessage, tools } = require('../utils/prompt');
const { replaceBlacklistedWords } = require('../utils/blacklist');
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'personalityTraits.json');
const tempFilePath = path.join(__dirname, 'personalityTraits.tmp.json');


let lastCommandTime = 0;
const cooldownDuration = 2000;
const ARR_MAX_LENGTH = 11; // Equals to 1 system message, 5 user messages and 5 assistant messages

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

let conversationArray = [];
let fileLock = false;

function acquireLock() {
    return new Promise(resolve => {
        const interval = setInterval(() => {
            if (!fileLock) {
                fileLock = true;
                clearInterval(interval);
                resolve();
            }
        }, 50);
    });
}

function releaseLock() {
    fileLock = false;
}

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

async function readPersonalityTraits() {
    await acquireLock();
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error("Failed to read personality traits:", error);
        throw new Error("Write operation failed");
    } finally {
        releaseLock();
    }
    return {};
}

function getUserTraits(userId) {
    const personalityTraits = readPersonalityTraits();
    return personalityTraits[userId] || null;
}

async function writePersonalityTraits(data) {
    await acquireLock();
    try {
        // Write to a temporary file first
        fs.writeFileSync(tempFilePath, JSON.stringify(data, null, 2), 'utf-8');
        // Rename the temporary file to the actual file
        fs.renameSync(tempFilePath, filePath);
    } catch (error) {
        console.error("Failed to write personality traits:", error);
        // Remove the temporary file if something went wrong
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
        // Do not proceed if writing fails
        throw new Error("Write operation failed");
    } finally {
        releaseLock();
    }
}

async function setPersonality(user_id, userName, personality_trait, response_text) {
    const personalityTraits = await readPersonalityTraits();

    // Slice if longer than 10 traits
    function sliceTraitsString(traitsString) {
        let traitsArray = traitsString.split(',').map(trait => trait.trim());
        if (traitsArray.length > 10) {
            traitsArray = traitsArray.slice(traitsArray.length - 10);
        }
        return traitsArray.join(', ');
    }

    if (personalityTraits[user_id]) {
        personalityTraits[user_id].name = userName;
        personalityTraits[user_id].traits = sliceTraitsString(personality_trait);
    } else {
        // Add new user
        personalityTraits[user_id] = {
            name: userName,
            traits: personality_trait
        };
    }

    await writePersonalityTraits(personalityTraits);
    return response_text;
}

module.exports = {
    name: Events.MessageCreate,
    async execute(interaction) {
        if (interaction.author.bot) return;
        // Check if the bot is directly mentioned
        const botMentioned = interaction.mentions.users.has(interaction.client.user.id);
        if (!interaction.reference && !botMentioned) return; // Escape early to avoid fetching channel messages
        const repliedToBot = interaction.reference && (await interaction.channel.messages.fetch(interaction.reference.messageId)).author.id === interaction.client.user.id;
        if (!botMentioned && !repliedToBot) return;
        const userQuestion = botMentioned ? interaction.content.replace(`<@${interaction.client.user.id}>`, '').trim() : interaction.content;
        if (!userQuestion) return;

        try {
            await interaction.channel.sendTyping();
            const currentTime = Date.now();
            if (currentTime - lastCommandTime < cooldownDuration) {
                const waitTime = cooldownDuration - (currentTime - lastCommandTime);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
            lastCommandTime = currentTime;

            const userId = interaction.author.id;
            const guildMember = await interaction.guild.members.fetch(userId);
            const userTraits = getUserTraits(userId);
            const userName = guildMember.displayName;
            let personalizedQuestion = `${userName} (${userId}): ${userQuestion}`;

            if (userTraits) {
                personalizedQuestion = `${userName} (${userId}) (${userTraits.traits}): ${userQuestion}`;
            }

            includeSystemMessage() // ensure system message is included in prompt
            const prompt = replaceBlacklistedWords(personalizedQuestion); // Make the question prompt friendly
            addMessage('user', prompt); // add user message to prompt
            console.log(conversationArray)

            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: conversationArray,
                temperature: 1.15,
                max_tokens: 512,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
                tools: tools,
                tool_choice: 'auto'
            });

            if (!response || !response.choices[0]) {
                await interaction.reply(`Erm... I can't answer right now, please try again later!<3`).catch(console.error);
            }
            const replyContent = response.choices[0].message.content;
            const botMessage = replyContent ? replyContent : `Sure, I'll write that down!`;
            const functionParams = response.choices?.[0]?.message?.tool_calls?.[0]?.function ?? undefined;

            if (functionParams) {
                const { user_id, personality_trait, response_text } = JSON.parse(functionParams.arguments)
                const botMessagePersonality = await setPersonality(user_id, userName, personality_trait, response_text);
                addMessage('assistant', botMessagePersonality); // add bot message for future prompts
                const chunks = splitMessage(botMessagePersonality);
                for (const chunk of chunks) {
                    await interaction.reply({
                        content: chunk,
                        allowedMentions: {
                            users: [userId], // Allow mention for specific user
                        }
                    }).catch(console.error);
                }
            } else {
                addMessage('assistant', botMessage); // add bot message for future prompts
                const chunks = splitMessage(botMessage);
                for (const chunk of chunks) {
                    await interaction.reply({
                        content: chunk,
                        allowedMentions: {
                            users: [userId], // Allow mention for specific user
                        }
                    }).catch(console.error);
                }
            }
        } catch (error) {
            console.error('Error occurred:', error);
        }
    },
};
