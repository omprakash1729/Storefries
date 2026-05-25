import fs from 'fs';
const content = fs.readFileSync('src/pages/Listing.tsx', 'utf8');
const lines = content.split('\n');

const keywords = ['isAuthModalOpen', 'modalForm', 'authMode', 'modalPassword', 'modalLoading'];
keywords.forEach(keyword => {
  console.log(`=== Matches for "${keyword}" ===`);
  lines.forEach((line, idx) => {
    if (line.includes(keyword)) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  });
});
