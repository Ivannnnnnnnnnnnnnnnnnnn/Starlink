const telegramBot = require('./backend/telegram-bot');
const status = telegramBot.getApprovalStatus('REQ-MSJ6GZU7');
console.log('Current status:', status.status);
