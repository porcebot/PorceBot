const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Boycourt')
        .setType(ApplicationCommandType.User),

    async execute() { },
};