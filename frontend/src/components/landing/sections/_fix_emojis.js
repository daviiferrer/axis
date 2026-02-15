const fs = require('fs');
let c = fs.readFileSync('conversation-showcase.tsx', 'utf8');

// Remove leading emoji characters + space from event text values
// Emojis used: 📛 🎯 📊 ⬆️ 📅 ✅ ⚠️ 🛒 💰 🤝 🎬 🧑‍💻 🔑 ⚖️
// Pattern: after type: "event", text: " — strip any non-ASCII chars + space at start
c = c.replace(/(type:\s*"event",\s*text:\s*")([^\u0000-\u007F\s]*\s+)/g, '$1');

fs.writeFileSync('conversation-showcase.tsx', c, 'utf8');

// Verify
const matches = c.match(/type:\s*"event",\s*text:\s*"([^"]{0,60})/g);
if (matches) {
    console.log(`Found ${matches.length} event texts:`);
    matches.forEach(m => console.log('  ', m));
}
