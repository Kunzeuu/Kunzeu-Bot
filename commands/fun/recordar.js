const cron = require('node-cron');

module.exports = (client) => {
    // Programar el recordatorio para cada lunes a las 2:00 AM (Colombia)
    cron.schedule('0 7 * * 1', () => {
        const channel = client.channels.cache.get('1135336516588146719'); // Reemplaza con el ID del canal donde deseas enviar el mensaje
        const roleId = '1239969056099012628'; // Reemplaza con el ID del rol que deseas mencionar

        if (channel) {
            channel.send(`Hoy se reinicia la semana. ¡Recuerda comprar tus ASS! <@&${roleId}>`);
        } else {
            console.error('Channel not found!');
        }
    });
};