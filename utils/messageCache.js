
const messageCache = new Map();

async function fetchAndCacheMessages(interaction, targetChannelId) {
    const targetChannel = interaction.client.channels.cache.get(targetChannelId);
    const messages = await targetChannel.messages.fetch({ limit: 100 });

    // Store in cache
    messageCache.set(targetChannelId, {
        fetchedAt: Date.now(),
        messages: messages
    });

    // Set a cache expiration (e.g., 10 minutes)
    setTimeout(() => messageCache.delete(targetChannelId), 1 * 60 * 1000); // 1 minute

    return messages;
}

async function getMessages(interaction, targetChannelId) {
    if (messageCache.has(targetChannelId)) {
        const cacheEntry = messageCache.get(targetChannelId);
        const isStale = (Date.now() - cacheEntry.fetchedAt) > (1 * 60 * 1000); // 1 minute

        if (!isStale) {
            return cacheEntry.messages;
        }
    }
    return await fetchAndCacheMessages(interaction, targetChannelId);
}

module.exports = { fetchAndCacheMessages, getMessages };