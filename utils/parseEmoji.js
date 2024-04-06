async function replaceTextWithEmojis(input, guild) {
    const emojiRegex = /:([^:\s]+):/g;
    let matches = [...input.matchAll(emojiRegex)]; // Collect all matches first
    let output = input;

    for (const match of matches) {
        const fullMatch = match[0];
        const emojiName = match[1];
        const emoji = guild.emojis.cache.find(e => e.name === emojiName);

        if (emoji) {
            // Construct the appropriate string for both animated and static emojis
            const emojiString = emoji.toString(); // This automatically handles the formatting
            // Replace the first occurrence of the match in the output string
            output = output.replace(fullMatch, emojiString);
        }
    }

    return output;
}

module.exports = { replaceTextWithEmojis };
