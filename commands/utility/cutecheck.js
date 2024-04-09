const { ApplicationCommandType, ContextMenuCommandBuilder } = require('discord.js');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Cute Check')
        .setType(ApplicationCommandType.User),

    async execute() { },
};