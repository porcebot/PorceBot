const { ApplicationCommandType, ContextMenuCommandBuilder } = require('discord.js');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Assign Verified')
        .setType(ApplicationCommandType.User),

    async execute() { },
};