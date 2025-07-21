// Random name generator for players who don't enter a name
const adjectives = [
  'Swift', 'Brave', 'Clever', 'Bold', 'Quick', 'Sharp', 'Bright', 'Lucky', 'Speedy', 'Smart',
  'Wild', 'Cool', 'Epic', 'Super', 'Mega', 'Ultra', 'Fast', 'Strong', 'Mighty', 'Noble',
  'Fancy', 'Fierce', 'Smooth', 'Silent', 'Golden', 'Silver', 'Royal', 'Magic', 'Cosmic', 'Stellar'
];

const nouns = [
  'Artist', 'Painter', 'Sketcher', 'Doodler', 'Creator', 'Drawer', 'Designer', 'Illustrator', 'Crafter', 'Maker',
  'Wizard', 'Hero', 'Champion', 'Legend', 'Master', 'Ace', 'Star', 'Genius', 'Pro', 'Expert',
  'Tiger', 'Eagle', 'Wolf', 'Lion', 'Fox', 'Bear', 'Hawk', 'Falcon', 'Shark', 'Phoenix'
];

export const generateRandomName = (): string => {
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 99) + 1;
  
  return `${randomAdjective}${randomNoun}${randomNumber}`;
};