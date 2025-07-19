// scripts/slack-reminder.js
// Usage: node scripts/slack-reminder.js <message>

const { WebClient } = require('@slack/web-api');

const SLACK_TOKEN = 'YOUR_SLACK_TOKEN'; // TODO: Set your Slack bot token
const CHANNEL_ID = 'YOUR_CHANNEL_ID'; // TODO: Set your Slack channel ID
const message = process.argv.slice(2).join(' ') || 'Daily standup reminder!';

const slack = new WebClient(SLACK_TOKEN);

async function sendReminder() {
  try {
    await slack.chat.postMessage({ channel: CHANNEL_ID, text: message });
    console.log('Slack reminder sent!');
  } catch (err) {
    console.error('Error sending Slack reminder:', err);
  }
}

sendReminder(); 