const { Events } = require('discord.js');
const { OpenAI } = require('openai');
const { tools } = require('../utils/prompt');
const { replaceBlacklistedWords } = require('../utils/blacklist');
const fs = require('fs');
const path = require('path');
const systemMessageEmitter = require('./events');
const ready = require('./ready');
const filePath = path.join(__dirname, '..', 'data', 'personalityTraits.json');
const filePathSystem = path.join(__dirname, '..', 'data', 'systemPrompt.json');
const writeFileAtomic = require('write-file-atomic');
const channelFilePath = './channelData.json';

let lastCommandTime = 0;
const cooldownDuration = 2000;
const ARR_MAX_LENGTH = 11; // Equals to 1 system message, 5 user messages and 5 assistant messages

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

let conversationArray = [];
const recencyBiasMap = new Map();

let systemMessage = loadSystemMessage();

function loadSystemMessage() {
    try {
        const data = fs.readFileSync(filePathSystem, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading system message:', error);
        return { role: 'system', content: '' };
    }
}

systemMessageEmitter.on('systemMessageUpdated', (newMessage) => {
    console.log('System message updated:', newMessage);
    systemMessage = newMessage; // Update the global variable
});

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

function readChannel() {
    if (fs.existsSync(channelFilePath)) {
        const data = fs.readFileSync(channelFilePath, 'utf-8');
        const JSONData = JSON.parse(data)
        const keys = Object.keys(JSONData);
        return keys;
    }
    return undefined;
}

function readPersonalityTraits() {
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    }
    return {};
}

function getUserTraits(userId) {
    const personalityTraits = readPersonalityTraits();
    return personalityTraits[userId] || null;
}


function getUserTraitsString(botId) {
    const personalityTraits = readPersonalityTraits();
    let resultString = ``;

    // Get the top 5 most recent users
    const recentUsers = [...recencyBiasMap.entries()]
        .sort((a, b) => b[1] - a[1]) // Sort by date, most recent first
        .slice(0, 5) // Take the top 5
        .map(entry => entry[0]); // Extract the userId

    for (const userId of Object.keys(personalityTraits)) {
        if (recentUsers.includes(userId)) {
            const user = personalityTraits[userId];
            const name = user.name;
            const traits = user.traits;
            if (userId !== botId) {
                resultString += `(${name}): ${traits}, `;
            }
        }
    }

    if (resultString.endsWith(', ')) {
        resultString = resultString.slice(0, -2);
    }

    return resultString;
}


async function writePersonalityTraits(data) {
    try {
        await writeFileAtomic(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error writing file:', error);
    }
}

async function setPersonality(user_id, userName, personality_trait, response_text) {
    const personalityTraits = readPersonalityTraits();

    // Function to slice traits string if longer than 6 traits
    function sliceTraitsString(traitsString) {
        let traitsArray = traitsString.split(',').map(trait => trait.trim());
        if (traitsArray.length > 6) {
            traitsArray = traitsArray.slice(traitsArray.length - 6);
        }
        return traitsArray.join(', ');
    }

    if (personalityTraits[user_id]) {
        // Append the new trait to existing traits
        let existingTraits = personalityTraits[user_id].traits;
        let newTraitsString = `${existingTraits}, ${personality_trait}`;
        personalityTraits[user_id].traits = sliceTraitsString(newTraitsString);
    } else {
        // Add new user
        personalityTraits[user_id] = {
            name: userName,
            traits: personality_trait
        };
    }

    // Ensure the name is always updated
    personalityTraits[user_id].name = userName;

    await writePersonalityTraits(personalityTraits);
    return response_text;
}

async function updateAIPersonality(bot_id, updated_behaviors, response_text) {
    const personalityTraits = readPersonalityTraits();
    if (personalityTraits[bot_id]) {
        personalityTraits[bot_id].traits = updated_behaviors;
    }
    await writePersonalityTraits(personalityTraits);
    return response_text;
}


function includeSystemMessage(botId) {
    let AITraits = getUserTraits(botId);
    let userTraits = getUserTraitsString(botId);

    // Create a new object for systemMessageModified to avoid modifying the original systemMessage
    let systemMessageModified = {
        ...systemMessage, // Shallow copy the properties of systemMessage
        content: systemMessage.content // Initialize content with the original systemMessage content
    };

    if (userTraits) {
        systemMessageModified.content += ` NOTE: I will give you people's names and ID's below and their interests in parentheses. Use them when it is related to the conversation: ${userTraits} `;
    }

    if (AITraits) {
        systemMessageModified.content += ` NOTE: Someone has given you instructions. You must follow these rules, always, until told otherwise: ${AITraits.traits}`;
    }

    const systemMessageIndex = conversationArray.findIndex(msg => msg.role === 'system');

    if (systemMessageIndex !== -1) {
        // Update the existing system message
        conversationArray[systemMessageIndex] = systemMessageModified;
    } else {
        // Insert the new system message if none exists
        conversationArray.unshift(systemMessageModified);
    }

}


function removeTraits(conversationArray, userName) {
    return conversationArray.map(message => {
        const regex = new RegExp(`\\(${userName}\\) \\([^\\)]*\\)`, 'g');
        message.content = message.content.replace(regex, `(${userName})`);
        return message;
    });
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

        let matchingIdFound = false;
        const allowedChannelsId = readChannel();
        const channelId = interaction.channel.id ? interaction.channel.id : interaction.channelId;

        if (allowedChannelsId) {
            for (let i = 0; i < allowedChannelsId.length; i++) {
                if (allowedChannelsId[i] === channelId) {
                    matchingIdFound = true;
                    break;
                }
            }
        }
        if (!matchingIdFound) return;

        try {
            await interaction.channel.sendTyping();
            const currentTime = Date.now();
            if (currentTime - lastCommandTime < cooldownDuration) {
                const waitTime = cooldownDuration - (currentTime - lastCommandTime);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
            lastCommandTime = currentTime;

            const botInfo = ready.getBotInfo();
            let botMessage;
            const userId = interaction.author.id;
            recencyBiasMap.set(userId, Date.now());
            const botId = botInfo.id;
            const guildMember = await interaction.guild.members.fetch(userId);
            const userTraits = getUserTraits(userId);
            const userName = guildMember.displayName;
            const botName = botInfo.username;
            let personalizedQuestion = `(${userName}) ${userQuestion}`;

            if (userTraits) {
                conversationArray = removeTraits(conversationArray, userName);
                personalizedQuestion = `(${userName}) ${userQuestion}`;
            }

            includeSystemMessage(botId) // ensure system message is included in prompt
            const prompt = replaceBlacklistedWords(personalizedQuestion); // Make the question prompt friendly
            addMessage('user', prompt); // add user message to prompt

            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: conversationArray,
                temperature: 1.20,
                max_tokens: 256,
                top_p: 1,
                frequency_penalty: 0.25,
                presence_penalty: 0.25,
                tools: tools,
                tool_choice: 'auto'
            });

            if (!response || !response.choices[0]) {
                await interaction.reply(`Erm... I can't answer right now, please try again later!<3`).catch(console.error);
                return;
            }

            const replyContent = response.choices[0].message.content;
            const functionParams = response.choices?.[0]?.message?.tool_calls?.[0]?.function ?? undefined;

            if (replyContent) {
                botMessage = replyContent;
            }

            if (functionParams) {
                if (functionParams.name === 'set_behavior') { // Sets bot behavior
                    const { behavior_type, response_text } = JSON.parse(functionParams.arguments);
                    botMessage = await setPersonality(botId, botName, behavior_type, response_text);
                }
                if (functionParams.name === 'update_behaviors') { // Sets bot behavior
                    const { updated_behaviors, response_text } = JSON.parse(functionParams.arguments);
                    botMessage = await updateAIPersonality(botId, updated_behaviors, response_text);
                }
                /*
                if (functionParams.name === 'set_interest') { // Sets user traits
                    const { user_id, personality_trait, response_text } = JSON.parse(functionParams.arguments);
                    botMessage = await setPersonality(user_id, userName, personality_trait, response_text);
                }
                    */
            }
            if (!replyContent && !functionParams) {
                await interaction.reply("No response generated. Please inform Porce! :c")
                return;
            }

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
            console.log(conversationArray)
            //console.log(response)
            return;

        } catch (error) {
            await interaction.reply(`Erm... I feel a bit dizzy.`)
            conversationArray = [];
            console.log(error)
        }
    },
};
