const fs = require('fs');
let content = fs.readFileSync('src/pages/Listing.tsx', 'utf8');
const searchString = 'import { useEffect, useState, useRef } from \x22react\x22;';
const first = content.indexOf(searchString);
const second = content.indexOf(searchString, first + 10);
if (second !== -1) {
  fs.writeFileSync('src/pages/Listing.tsx', content.substring(second));
  console.log('Fixed duplicate imports!');
} else {
  console.log('Second import not found.');
}
