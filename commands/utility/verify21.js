const { PermissionFlagsBits, ApplicationCommandType, ContextMenuCommandBuilder } = require('discord.js');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Assign Verified and 21')
        .setType(ApplicationCommandType.User)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute() { },
};