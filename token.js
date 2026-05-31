/**
 * Compatibility config for the web + Telegram hybrid.
 * Set BOT_TOKEN in the environment to enable Telegram admin commands.
 */

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN || '8563843945:AAFiPabb9MqY3RIwB4oTdl0djm1eBG-jIE0',
  startupPassword: process.env.STARTUP_PASSWORD || 'kaneki',
  WEB_BASE_URL: process.env.WEB_BASE_URL || 'http://127.0.0.1:3000',
};
