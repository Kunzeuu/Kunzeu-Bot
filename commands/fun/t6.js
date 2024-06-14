const { SlashCommandBuilder } = require('discord.js');
const { getGw2ApiData } = require('../utility/api.js'); // Ajusta la ruta según tu estructura de archivos

module.exports = {
  data: new SlashCommandBuilder()
    .setName('t6')
    .setDescription('Calculate the total price of materials T6.')
    .addIntegerOption(option => 
      option.setName('quantity')
        .setDescription('Multiplier for the stack size to calculate the price')
        .setRequired(true)
    ),

  async execute(interaction) {
    const itemIds = [24295, 24358, 24351, 24357, 24289, 24300, 24283, 24277];
    const stackSize = 250;
    const userQuantity = interaction.options.getInteger('quantity');
    const totalQuantity = stackSize * userQuantity;

    try {
      let totalPrecioVenta = 0;

      // Llama a la función para obtener el precio de venta de cada objeto
      await Promise.all(itemIds.map(async (itemId) => {
        const objeto = await getGw2ApiData(`commerce/prices/${itemId}`, 'en');
        if (objeto && objeto.sells) {
          totalPrecioVenta += objeto.sells.unit_price * stackSize;
        }
      }));

      // Calcula el 90% del precio total
      const precioTotal90 = totalPrecioVenta * 0.9;

      // Calcula el precio basado en la cantidad total calculada
      let totalPrecioVentaUser = 0;

      await Promise.all(itemIds.map(async (itemId) => {
        const objeto = await getGw2ApiData(`commerce/prices/${itemId}`, 'en');
        if (objeto && objeto.sells) {
          totalPrecioVentaUser += objeto.sells.unit_price * totalQuantity;
        }
      }));

      // Calcula el 90% del precio total basado en la cantidad total calculada
      const precioTotalUser90 = totalPrecioVentaUser * 0.9;

      // Calcula el número de monedas (oro, plata y cobre) y agrega los emotes correspondientes
      const calcularMonedas = (precio) => {
        const oro = Math.floor(precio / 10000);
        const plata = Math.floor((precio % 10000) / 100);
        const cobre = precio % 100;
        return `${oro} <:gold:1134754786705674290> ${plata} <:silver:1134756015691268106> ${cobre} <:Copper:1134756013195661353>`;
      };

      const embed = {
        title: 'Total price of materials T6',
        description: `The total price at 100% of the T6 materials is: ${calcularMonedas(totalPrecioVenta)}.\n` +
                     `The total price at 90% of the T6 materials is: ${calcularMonedas(precioTotal90.toFixed(0))}.\n\n` +
                     `The total price for ${totalQuantity} materials at 100% is: ${calcularMonedas(totalPrecioVentaUser)}.\n` +
                     `The total price for ${totalQuantity} materials at 90% is: ${calcularMonedas(precioTotalUser90.toFixed(0))}.`,
        color: 0xffc0cb, // Color del borde del Embed (opcional, puedes cambiarlo o quitarlo)
        thumbnail: { url: 'https://cdn.discordapp.com/attachments/1063915155211173980/1251006291086676038/s-l1600.jpg?ex=666d01e6&is=666bb066&hm=653fd1d9a685beb419a7f846558dbb261905315b9c40b3f880a5faa30e762e78&'},
        
      };

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error al realizar la solicitud:', error.message);
      await interaction.reply('Oops! There was an error in calculating the total price of T6 materials.');
    }
  },
};
