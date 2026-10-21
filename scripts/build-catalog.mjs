import * as Phosphor from '@phosphor-icons/react';
import fs from 'fs';

// Filter unique icon component names
const iconNames = Object.keys(Phosphor).filter(k => {
  return !k.endsWith('Icon') && !k.endsWith('Context') && !k.endsWith('Provider') && k !== 'Icon' && k !== 'default';
});

console.log("Unique icons:", iconNames.length);

const categoryRules = [
  {
    category: 'Fitness & Sports',
    keywords: ['Barbell', 'Run', 'Walk', 'Bike', 'Bicycle', 'Swim', 'Sneaker', 'Heartbeat', 'Target', 'Trophy', 'Medal', 'Basketball', 'Football', 'Soccer', 'Tennis', 'Baseball', 'Bowling', 'Golf', 'Boxing', 'Ski', 'Snowboard', 'Skateboard', 'Swimming', 'Martial', 'Sword', 'Horse', 'Dumbbell', 'Paddle', 'Volleyball', 'Cricket', 'Whistle', 'Activity', 'Speedometer', 'Footprints', 'Barbell']
  },
  {
    category: 'Health & Mind',
    keywords: ['Lotus', 'Flower', 'Brain', 'Drop', 'Pill', 'FirstAid', 'Heart', 'Smiley', 'Peace', 'Sparkle', 'Feather', 'Sun', 'Moon', 'Bed', 'Snowflake', 'Pray', 'YinYang', 'Eye', 'Tooth', 'Shower', 'Bathtub', 'Soap', 'Thermometer', 'Pulse', 'ShieldPlus', 'Syringe', 'Prescription', 'Stethoscope', 'Mask', 'Virus', 'Lungs', 'Bandaid', 'HandSoap', 'Toilet']
  },
  {
    category: 'Productivity & Tech',
    keywords: ['Rocket', 'Lightning', 'Clock', 'Timer', 'Alarm', 'Hourglass', 'Laptop', 'Desktop', 'Computer', 'Code', 'Terminal', 'Check', 'List', 'Briefcase', 'Calendar', 'Pin', 'PushPin', 'Flag', 'ShieldCheck', 'Cpu', 'Keyboard', 'Mouse', 'Monitor', 'Device', 'Phone', 'Folder', 'File', 'HardDrive', 'Bug', 'Git', 'Kanban', 'Stack', 'Robot', 'Lock', 'Key', 'Wrench', 'Gear', 'Tool', 'Hammer', 'Screwdriver', 'Sliders', 'Toggle']
  },
  {
    category: 'Learning & Arts',
    keywords: ['Book', 'Bookmark', 'Graduation', 'Pencil', 'Pen', 'Lightbulb', 'Palette', 'Paint', 'Music', 'Guitar', 'Piano', 'Microphone', 'Headphones', 'Globe', 'Translate', 'Certificate', 'Student', 'Chalkboard', 'Exam', 'Newspaper', 'Scroll', 'Compass', 'Ruler', 'Math', 'Pi', 'Sigma', 'Film', 'Video', 'Camera', 'Cassette', 'Vinyl', 'Speaker', 'MagicWand']
  },
  {
    category: 'Food & Nutrition',
    keywords: ['Fork', 'Knife', 'Restaurant', 'Coffee', 'Tea', 'Mug', 'Cup', 'Egg', 'Apple', 'Carrot', 'Fish', 'Cookie', 'Cake', 'Pizza', 'Bread', 'Hamburger', 'Popcorn', 'Wine', 'Beer', 'Martini', 'Bottle', 'Cooking', 'Bowl', 'Chef', 'IceCream', 'Candy', 'Orange', 'Shrimp', 'Pepper', 'DropSlash', 'Cigarette', 'Meat', 'Avocado']
  },
  {
    category: 'Finance & Wealth',
    keywords: ['Dollar', 'Currency', 'Coin', 'Coins', 'Piggy', 'Wallet', 'Bank', 'CreditCard', 'Money', 'Receipt', 'Vault', 'Diamond', 'Crown', 'Handshake', 'Percent', 'TrendUp', 'TrendDown', 'Graph', 'Chart', 'Scales', 'Gavel', 'Safe', 'Tag', 'Shopping', 'Cart', 'Bag']
  },
  {
    category: 'Lifestyle & Home',
    keywords: ['House', 'Home', 'Car', 'Airplane', 'Train', 'Bus', 'Boat', 'Dog', 'Cat', 'Bird', 'Paw', 'Broom', 'Shirt', 'Dress', 'Pants', 'Game', 'Joystick', 'Gift', 'Confetti', 'Party', 'Sunglasses', 'Watch', 'Armchair', 'Chair', 'Door', 'Key', 'Garage', 'Package', 'Luggage', 'Passport', 'Ticket', 'Camera', 'Mirror']
  },
  {
    category: 'Nature & Outdoors',
    keywords: ['Tree', 'Leaf', 'Plant', 'PottedPlant', 'Mountain', 'Forest', 'Camp', 'Tent', 'Fire', 'Flame', 'Cloud', 'Rain', 'Wind', 'Tornado', 'Rainbow', 'Waves', 'Anchor', 'Compass', 'Binoculars', 'Planet', 'Star', 'ShootingStar', 'Meteor', 'SunDim', 'MoonStars', 'Sunrise', 'Sunset']
  }
];

const catalog = iconNames.map(name => {
  // Format readable display name
  const formattedName = name.replace(/([A-Z])/g, ' $1').trim();
  
  // Categorize
  let matchedCat = 'Symbols & UI';
  for (const rule of categoryRules) {
    if (rule.keywords.some(kw => name.toLowerCase().includes(kw.toLowerCase()))) {
      matchedCat = rule.category;
      break;
    }
  }
  
  return {
    id: name,
    name: formattedName,
    componentName: name,
    category: matchedCat
  };
});

console.log("Catalog created. Distribution:");
const counts = {};
catalog.forEach(i => {
  counts[i.category] = (counts[i.category] || 0) + 1;
});
console.log(counts);
