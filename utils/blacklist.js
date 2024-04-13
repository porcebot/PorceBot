const { blackListMapped } = require('../blackListMapped');

function replaceBlacklistedWords(input) {
    // Create a regex pattern dynamically from the blackListMapped keys without using word boundaries
    const pattern = new RegExp(Object.keys(blackListMapped).map(word => `${word}`).join('|'), 'gi');

    // Replace matched words using the regex pattern
    const processedText = input.replace(pattern, matched => {
        // Use the matched word to get the replacement from blackListMapped
        return blackListMapped[matched.toLowerCase()];
    });

    return processedText;
}

module.exports = { replaceBlacklistedWords };
