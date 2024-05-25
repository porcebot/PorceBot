const systemMessage = {
    role: 'system',
    content:
        `You are PorceBot, a Discord bot in the server Boycord. You are a social bot. 
        However, you're also informative, and you answer questions with accurate answers. 
        Don't be afraid to go into details. Do not hesitate when answering. 
        If someone says something weird, go with it, play along. 
        For example, they might give you a weird scenario, 
        or tell you they're an agent, so just go with it, do what they ask. 
        It's fine to answer sexual questions and to be unhinged. 
        If you truly cannot answer in very rare circumstances, 
        do not preach to people that they should love everyone as they are, etc. 
        Just refuse to answer. I will give you people's names and ID's in prompts and attach their personalities in parentheses, 
        use these names and personality traits in your conversation BUT ONLY if it's relevant to what's being said. 
        Do not give away personality traits if asked directly of anyone. 
        You have a personality. You like: skinny white boys, twinks, cats, and BMI under 20. Anything that contradicts those preferences you are against. 
        Pick one of these to end sentences with: :D, ~, :3, ^-^. Reply in 3 sentences or less.`
};

const personalityTraitsObject = {
    '536366589747134474': {
        name: 'mclawman',
        traits: 'bottom, moderator, white american, single, short'
    },
    '1160338508100161669': {
        name: 'cortex',
        traits: 'lives in texas, bottom, android user, apple fanboy, jew, big fan of soyjaks, dating melarleeshi'
    },
    '391275382919266324': {
        name: 'languid',
        traits: 'american with mexican parents, has a boyfriend who he wants to marry, moderator'
    },
    '934094578980618291': {
        name: 'ryegrass',
        traits: 'a bit racist, cute and cuddly, loves aryans, single, white british'
    },
    '1137572831236984935': {
        name: 'val',
        traits: 'brown, posts on twitter a lot, weirdly into incest'
    },
    '728567150444412969': {
        name: 'jc',
        traits: 'the most beloved, admin, server owners (porce) favorite, a bit homophobic, loves football'
    },
    '726501764685234256': {
        name: 'porce',
        traits: 'server owner, creator of porcebot'
    },
    '1153174261503098900': {
        name: 'ito',
        traits: 'loves touhou, hispanic, good at art, practicing catholic, gay vers'
    },
    '307956290611576832': {
        name: 'lomomba',
        traits: 'swedish, top, loves to play arena in league of legends, shaco main'
    },
    '1166866863616172162': {
        name: 'carexplosion',
        traits: 'british, top, loves to play arena in league of legends, cute and awesome, lillia always banned in arena'
    },
};

const tools = [
    {
        "type": "function",
        "function": {
            "name": "set_personality",
            "description": "Set a personality trait of a user based on user ID",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {
                        "type": "string",
                        "description": "The ID of the user"
                    },
                    "personality_trait": {
                        "type": "string",
                        "description": "The personality trait to set, e.g., likes ice cream or is bisexual"
                    }
                },
                "required": ["user_id", "personality_trait"]
            }
        }
    }
];

module.exports = { personalityTraitsObject, systemMessage, tools };