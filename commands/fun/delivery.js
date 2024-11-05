const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const apiKeyDB = require('../../database/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delivery')
    .setDescription('Displays Trading Post delivery details'),

  async execute(interaction) {
    await interaction.deferReply();
    const userId = interaction.user.id;

    try {
      const apiKey = await apiKeyDB.getApiKey(userId);

      if (!apiKey) {
        return await interaction.editReply({
          content: '⚠️ You don\'t have a linked API key. Use `/apikey` to link your Guild Wars 2 API key.',
          ephemeral: true
        });
      }

      const deliveryDetails = await getDeliveryDetails(apiKey);
      const embed = await formatDeliveryDetailsEmbed(deliveryDetails, interaction.user);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error:', error);
      await interaction.editReply({
        content: '❌ An error occurred while processing your request.',
        ephemeral: true
      });
    }
  },
};

async function getDeliveryDetails(apiKey) {
  try {
    const response = await axios.get('https://api.guildwars2.com/v2/commerce/delivery', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Invalid API key');
    }
    throw error;
  }
}

async function formatDeliveryDetailsEmbed(details, user) {
  const gold = Math.floor(details.coins / 10000);
  const silver = Math.floor((details.coins % 10000) / 100);
  const copper = details.coins % 100;

  let itemsValue = 'No items to collect';
  if (details.items && details.items.length > 0) {
    const itemsWithNames = await Promise.all(details.items.map(async item => {
      try {
        const itemDetails = await getItemDetails(item.id);
        return {
          name: itemDetails.name,
          count: item.count,
          rarity: itemDetails.rarity,
          icon: itemDetails.icon
        };
      } catch (error) {
        return {
          name: `Unknown Item (${item.id})`,
          count: item.count,
          rarity: 'Basic',
          icon: 'https://render.guildwars2.com/file/483E3939D1A7010BDEA2970FB27703CAAD5FBB0F/42684.png'
        };
      }
    }));

    itemsValue = itemsWithNames
      .map(item => `${getRarityEmoji(item.rarity)} **${item.name}** x${item.count}`)
      .join('\n');
  }

  return {
    color: 0xdaa520, // Color dorado para Trading Post
    author: {
      name: `${user.username}'s Trading Post Delivery`,
      icon_url: user.displayAvatarURL()
    },
    title: '<:TP:1303367310538440848> Trading Post Deliveries',
    thumbnail: {
      url: 'https://wiki.guildwars2.com/images/8/81/Personal_Trader_Express.png'
    },
    fields: [
      {
        name: '<:bag:1303385936280813668> Coins to Collect',
        value: details.coins > 0 
          ? `${gold} <:gold:1134754786705674290> ${silver} <:silver:1134756015691268106> ${copper} <:Copper:1134756013195661353>`
          : 'No coins to collect',
        inline: false
      },
      {
        name: '<:Trading_post_unlock:1303391934072623236> Items to Collect',
        value: itemsValue,
        inline: false
      }
    ],
    footer: {
      text: 'Trading Post • Prices and items may vary',
      icon_url: 'https://wiki.guildwars2.com/images/thumb/2/24/Trading_Post_%28map_icon%29.png/20px-Trading_Post_%28map_icon%29.png'
    },
    timestamp: new Date()
  };
}

async function getItemDetails(itemId) {
  const response = await axios.get(`https://api.guildwars2.com/v2/items/${itemId}?lang=en`);
  return response.data;
}

function getRarityEmoji(rarity) {
  const rarityEmojis = {
    'Junk': '⚪',
    'Basic': '⚪',
    'Fine': '🔵',
    'Masterwork': '🟢',
    'Rare': '🟡',
    'Exotic': '🟠',
    'Ascended': '🔴',
    'Legendary': '💜'
  };
  return rarityEmojis[rarity] || '⚪';
}
