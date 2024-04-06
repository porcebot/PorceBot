async function replaceTextWithEmojis(input, guild) {
    // Regex to find text wrapped in colons (:example:)
    const emojiRegex = /:([^:\s]+):/g;
    let output = input;
    let match;

    // Loop over all matches in the confession text
    while ((match = emojiRegex.exec(input)) !== null) {
        // Extract the emoji name from the match
        const emojiName = match[1];
        // Attempt to find the emoji by name in the guild
        const emoji = guild.emojis.cache.find(e => e.name === emojiName);

        // If the emoji is found, replace its text representation with the actual emoji
        if (emoji) {
            const emojiString = emoji.animated ? `<a:${emojiName}:${emoji.id}>` : `<:${emojiName}:${emoji.id}>`;
            output = output.replace(`:${emojiName}:`, emojiString);
        }
    }

    return output;
}

module.exports = { replaceTextWithEmojis };