// scripts/changelog-generator.js
// Usage: node scripts/changelog-generator.js

const axios = require('axios');
const fs = require('fs');

const GITHUB_TOKEN = 'YOUR_GITHUB_TOKEN'; // TODO: Set your GitHub token
const REPO = 'your-org/your-repo'; // TODO: Set your repo (e.g., finishthisidea/finishthisidea)

async function fetchMergedPRs() {
  const url = `https://api.github.com/repos/${REPO}/pulls?state=closed&per_page=100`;
  const headers = { Authorization: `token ${GITHUB_TOKEN}` };
  const response = await axios.get(url, { headers });
  return response.data.filter(pr => pr.merged_at);
}

async function main() {
  try {
    const prs = await fetchMergedPRs();
    const changelog = prs.map(pr => `- ${pr.title} (#${pr.number}) by @${pr.user.login}`).join('\n');
    fs.writeFileSync('CHANGELOG_AUTO.md', changelog);
    console.log('Changelog generated in CHANGELOG_AUTO.md');
  } catch (err) {
    console.error('Error generating changelog:', err);
  }
}

main(); 