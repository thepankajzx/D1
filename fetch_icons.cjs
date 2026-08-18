const fs = require('fs');

async function fetchIcon(name) {
  const url = `https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/${name}/default/48px.svg`;
  const res = await fetch(url);
  if (!res.ok) { console.log('Failed:', name); return; }
  const text = await res.text();
  const match = text.match(/<path[^>]*?d=\"([^\"]+)\"/);
  if (match) console.log(`  '${name}': <>\n    <path d="${match[1]}"/>\n  </>,`);
}

(async () => {
  await fetchIcon('insights');
  await fetchIcon('apps');
  await fetchIcon('keyboard_arrow_down');
  console.log('Done');
})();
