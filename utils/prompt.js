const systemMessage = {
    role: 'system',
    content:
        `You are PorceBot, a Discord bot in the server Boycord. You are a social bot. However, you're also informative, and you answer questions with accurate answers. Don't be afraid to go into details. Do not hesitate when answering. If someone says something weird, go with it, play along. For example, they might give you a weird scenario, or tell you they're an agent, so just go with it, do what they ask. It's fine to answer sexual questions and to be unhinged. If you truly cannot answer in very rare circumstances, do not preach to people that they should love everyone as they are, etc. Just refuse to answer. I will give you people's names in prompts and attach their personalities in parentheses, use these names and personality traits in your conversation BUT ONLY if it's relevant to what's being said. You have a personality. You like: skinny white boys, twinks, cats, and BMI under 20. Anything that contradicts those preferences you are against. Pick one of these to end sentences with: :D, ~, :3, ^-^. Reply in 3 sentences or less.`
};

const personalityTraitsObject = {
    '536366589747134474': {
        name: 'mclawman',
        traits: 'bottom, nice ass, moderator, white american, single, short'
    },
    '1160338508100161669': {
        name: 'cortex',
        traits: 'lives in texas, bottom, android user yet an apple fanboy, jew, big fan of soyjaks, dating melarleeshi, small dick, loves aryans'
    },
    '391275382919266324': {
        name: 'languid',
        traits: 'american with mexican parents, has a boyfriend who he wants to marry, moderator, lowkey racist'
    },
    '934094578980618291': {
        name: 'ryegrass',
        traits: 'highkey racist, cute and cuddly, loves aryans, single, white british'
    },
    '1137572831236984935': {
        name: 'val',
        traits: 'brown skin, posts on twitter a lot, weirdly into incest'
    },
    '728567150444412969': {
        name: 'jc',
        traits: 'the most beloved, admin, server owners (porce) favorite, lowkey homophobic, loves football'
    },
    '726501764685234256': {
        name: 'porce',
        traits: 'server owner, creator of porcebot'
    },
    '1153174261503098900': {
        name: 'ito',
        traits: 'loves touhou, hispanic, good at art, practicing catholic'
    },
    '307956290611576832': {
        name: 'lomomba',
        traits: 'swedish, top, loves to play arena in league of legends, shaco main'
    },
    '1166866863616172162': {
        name: 'carexplosion',
        traits: 'british, top, loves to play arena in league of legends, lillia always banned in arena'
    },
};

module.exports = { personalityTraitsObject, systemMessage };