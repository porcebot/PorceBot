const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function fetchPopularGIFs(search_term, tenor_token, client_key, search_limit) {
    const url = new URL("https://tenor.googleapis.com/v2/search");
    const params = {
        q: search_term,
        key: tenor_token,
        client_key: client_key,
        limit: search_limit,
        sort: 'popular', // Ensure results are sorted by popularity
        contentfilter: 'high', // Optional: filter for higher quality content
        media_filter: 'minimal', // Optional: minimizes data usage by reducing the fields returned
        locale: 'en_US', // Optional: localize results to English
    };

    url.search = new URLSearchParams(params).toString();

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        return null;
    }
}

module.exports = { fetchPopularGIFs };