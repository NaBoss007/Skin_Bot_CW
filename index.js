require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const BOT_CHANNEL_ID = '1379487050960605234';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

const skinCodesByRole = {
  'Military Clearance C1': {
    displayName: 'Privates',
    codes: ['CODE_C1_1', 'CODE_C1_2']
  },
  'Non commissioned officer Clearance C2': {
    displayName: "NCO's",
    codes: ['CODE_C2_1']
  },
  'Warrant Officer Clearance C3': {
    displayName: 'Warrant Officers',
    codes: ['CODE_C3_1']
  },
  'Commissioned officer C4': {
    displayName: "CO's",
    codes: ['CODE_C4_1']
  },
  'Goverment Clearance C5': {
    displayName: 'Government',
    codes: ['CODE_C5_1']
  }
};

const specialSkinCodesByRole = {
  'Commonwealth Special Operation Regiment': {
    displayName: 'Special Operations',
    codes: ['SPEC_OP_1', 'SPEC_OP_2']
  },
  'Armoured corps': {
    displayName: 'Armoured Corps',
    codes: ['ARMOUR_1', 'ARMOUR_2']
  }
};

// Special skins exclusive for each top role
const specialSkins = {
  'Grand Marshal': {
    displayName: 'Grand Marshal Exclusive',
    codes: ['GRANDMARSHAL_SKIN1', 'GRANDMARSHAL_SKIN2']
  },
  'Director of Industry': {
    displayName: 'Director of Industry Exclusive',
    codes: ['DOI_SKIN1']
  },
  'War Minister': {
    displayName: 'War Minister Exclusive',
    codes: ['WARMINISTER_SKIN1']
  }
};

const commands = [
  {
    name: 'getuniformcode',
    description: 'Get uniform codes coherent to your clearance level',
  },
];

const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands },
    );
  } catch (e) {
    console.error(e);
  }
})();

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName !== 'getuniformcode') return;

  if (interaction.channelId !== BOT_CHANNEL_ID) {
    await interaction.reply({ content: 'Use this command in the designated bot channel.', ephemeral: true });
    return;
  }

  const memberRoles = interaction.member.roles.cache;

  // Find special top roles
  const grandMarshalRole = interaction.guild.roles.cache.find(r => r.name === 'Grand Marshal');
  const directorOfIndustryRole = interaction.guild.roles.cache.find(r => r.name === 'Director of Industry');
  const warMinisterRole = interaction.guild.roles.cache.find(r => r.name === 'War Minister');

  const isGrandMarshal = grandMarshalRole && memberRoles.has(grandMarshalRole.id);
  const isDirectorOfIndustry = directorOfIndustryRole && memberRoles.has(directorOfIndustryRole.id);
  const isWarMinister = warMinisterRole && memberRoles.has(warMinisterRole.id);

  const embed = new EmbedBuilder().setColor(0x3498db);

  // Set title based on role
  if (isGrandMarshal) {
    embed.setTitle('Welcome Grand Marshal NolletKroket, here are your uniforms');
  } else if (isDirectorOfIndustry) {
    embed.setTitle('Welcome Director of Industry, here are your uniforms');
  } else if (isWarMinister) {
    embed.setTitle('Welcome War Minister, here are your uniforms');
  } else {
    embed.setTitle(`Uniform Codes for *${interaction.user.username}*`);
  }

  // Add special exclusive skin codes on top for relevant roles
  const topSpecialFields = [];

  if (isGrandMarshal) {
    // Grand Marshal sees all exclusive special skins on top
    for (const roleKey of ['Grand Marshal', 'Director of Industry', 'War Minister']) {
      const skin = specialSkins[roleKey];
      if (skin) {
        topSpecialFields.push({ name: skin.displayName, value: skin.codes.join('\n'), inline: false });
      }
    }
  } else if (isDirectorOfIndustry) {
    // DOI sees only DOI exclusive on top
    const skin = specialSkins['Director of Industry'];
    if (skin) topSpecialFields.push({ name: skin.displayName, value: skin.codes.join('\n'), inline: false });
  } else if (isWarMinister) {
    // War Minister sees only WM exclusive on top
    const skin = specialSkins['War Minister'];
    if (skin) topSpecialFields.push({ name: skin.displayName, value: skin.codes.join('\n'), inline: false });
  }

  if (topSpecialFields.length > 0) {
    embed.addFields(topSpecialFields);
    embed.addFields([{ name: '\u200B', value: '' }]); // spacer
  }

  // Now add the general skins and divisional skins
  if (isGrandMarshal || isDirectorOfIndustry || isWarMinister) {
    // These roles see ALL skins
    // General Commonwealth uniforms
    embed.addFields([{ name: '**GENERAL COMMONWEALTH UNIFORMS**', value: '' }]);
    for (const roleName in skinCodesByRole) {
      const { displayName, codes } = skinCodesByRole[roleName];
      embed.addFields({ name: displayName, value: codes.join('\n'), inline: false });
    }
    // Divisional uniforms
    embed.addFields([{ name: '\u200B', value: '' }]); // spacer
    embed.addFields([{ name: '**DIVISIONAL UNIFORMS**', value: '' }]);
    for (const roleName in specialSkinCodesByRole) {
      const { displayName, codes } = specialSkinCodesByRole[roleName];
      embed.addFields({ name: displayName, value: codes.join('\n'), inline: false });
    }
  } else {
    // Normal user sees only skins matching their roles
    const fields = [];
    const specialFields = [];

    for (const roleName in skinCodesByRole) {
      const role = interaction.guild.roles.cache.find(r => r.name === roleName);
      if (role && memberRoles.has(role.id)) {
        const { displayName, codes } = skinCodesByRole[roleName];
        fields.push({ name: displayName, value: codes.join('\n'), inline: false });
      }
    }

    for (const roleName in specialSkinCodesByRole) {
      const role = interaction.guild.roles.cache.find(r => r.name === roleName);
      if (role && memberRoles.has(role.id)) {
        const { displayName, codes } = specialSkinCodesByRole[roleName];
        specialFields.push({ name: displayName, value: codes.join('\n'), inline: false });
      }
    }

    if (fields.length === 0 && specialFields.length === 0) {
      await interaction.reply({ content: 'You do not have clearance for any skin codes.', ephemeral: true });
      return;
    }

    embed.addFields([{ name: '**GENERAL COMMONWEALTH UNIFORMS**', value: '' }]);
    embed.addFields(fields);

    if (specialFields.length > 0) {
      embed.addFields([{ name: '\u200B', value: '' }]);
      embed.addFields([{ name: '**DIVISIONAL UNIFORMS**', value: '' }]);
      embed.addFields(specialFields);
    }
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
});

client.once('clientReady', () => {
  console.log('Bot started and ready');
});




client.login(TOKEN);
