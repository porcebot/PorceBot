const { ApplicationCommandType, ContextMenuCommandBuilder } = require('discord.js');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Assign Chaser')
        .setType(ApplicationCommandType.User),

    async execute() { },
};