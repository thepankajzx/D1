import * as Phosphor from '@phosphor-icons/react';

const allKeys = Object.keys(Phosphor).filter(k => {
  // Filter out contexts, types, or internal helper exports
  return typeof Phosphor[k] === 'object' || typeof Phosphor[k] === 'function';
}).filter(k => !k.includes('Context') && !k.includes('Provider') && k !== 'Icon' && k !== 'default');

console.log("Total Phosphor Icons found:", allKeys.length);
console.log("Sample icons:", allKeys.slice(0, 30));
