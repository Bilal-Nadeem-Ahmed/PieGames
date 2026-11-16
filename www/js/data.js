// Shared learning data.
export const COLOURS = [
  { n: 'red', c: '#ef4444' }, { n: 'orange', c: '#fb923c' }, { n: 'yellow', c: '#facc15' }, { n: 'green', c: '#22c55e' },
  { n: 'blue', c: '#3b82f6' }, { n: 'purple', c: '#a855f7' }, { n: 'pink', c: '#f472b6' }, { n: 'white', c: '#f8fafc' },
];
export const ANIMALS = [
  ['🐶', 'Dog', 'Woof woof!'], ['🐱', 'Cat', 'Meow!'], ['🐮', 'Cow', 'Moo!'], ['🐑', 'Sheep', 'Baa!'],
  ['🦆', 'Duck', 'Quack quack!'], ['🦁', 'Lion', 'Roar!'], ['🐸', 'Frog', 'Ribbit!'], ['🐵', 'Monkey', 'Ooh ooh, aah aah!'],
  ['🐘', 'Elephant', 'Toot toot!'], ['🐴', 'Horse', 'Neigh!'], ['🐥', 'Chick', 'Cheep cheep!'], ['🐰', 'Bunny', 'Hop hop!'],
  ['🐻', 'Bear', 'Grrr!'], ['🐟', 'Fish', 'Blub blub!'], ['🦉', 'Owl', 'Twit twoo!'], ['🦖', 'Dinosaur', 'Roar!'], ['🐯', 'Tiger', 'Roar!'],
];
export const ABC = [
  ['A', '🍎', 'apple'], ['B', '🎈', 'balloon'], ['C', '🐱', 'cat'], ['D', '🐶', 'dog'], ['E', '🐘', 'elephant'], ['F', '🐟', 'fish'],
  ['G', '🍇', 'grapes'], ['H', '🏠', 'house'], ['I', '🍦', 'ice cream'], ['J', '🧃', 'juice'], ['K', '🪁', 'kite'], ['L', '🦁', 'lion'],
  ['M', '🌙', 'moon'], ['N', '👃', 'nose'], ['O', '🍊', 'orange'], ['P', '🐧', 'penguin'], ['Q', '👸', 'queen'], ['R', '🌈', 'rainbow'],
  ['S', '🐑', 'sheep'], ['T', '🌳', 'tree'], ['U', '☂️', 'umbrella'], ['V', '🚐', 'van'], ['W', '🐳', 'whale'], ['X', '🦊', 'fox'],
  ['Y', '🪀', 'yo-yo'], ['Z', '🦓', 'zebra'],
];
export const letterLine = ([L, , w]) => (L === 'X' ? `X. X is in ${w}!` : `${L}. ${L} is for ${w}!`);
// two more pictures for each letter (the first one is in ABC above)
export const ABC_MORE = {
  A: [['🐜', 'ant'], ['✈️', 'aeroplane']], B: [['🐻', 'bear'], ['🍌', 'banana']], C: [['🚗', 'car'], ['🐄', 'cow']], D: [['🦆', 'duck'], ['🦕', 'dinosaur']],
  E: [['🥚', 'egg'], ['👁️', 'eye']], F: [['🐸', 'frog'], ['🌸', 'flower']], G: [['🦒', 'giraffe'], ['🐐', 'goat']], H: [['🐴', 'horse'], ['🎩', 'hat']],
  I: [['🦎', 'iguana'], ['🏝️', 'island']], J: [['🧥', 'jacket'], ['🤹', 'juggler']], K: [['🔑', 'key'], ['🐨', 'koala']], L: [['🍋', 'lemon'], ['🐞', 'ladybird']],
  M: [['🐵', 'monkey'], ['🍄', 'mushroom']], N: [['🥜', 'nuts'], ['🌃', 'night']], O: [['🐙', 'octopus'], ['🦉', 'owl']], P: [['🐷', 'pig'], ['🍐', 'pear']],
  Q: [['❓', 'question'], ['🤫', 'quiet']], R: [['🐰', 'rabbit'], ['🚀', 'rocket']], S: [['☀️', 'sun'], ['⭐', 'star']], T: [['🐯', 'tiger'], ['🚂', 'train']],
  U: [['🦄', 'unicorn'], ['⬆️', 'up']], V: [['🎻', 'violin'], ['🌋', 'volcano']], W: [['🍉', 'watermelon'], ['⌚', 'watch']], X: [['📦', 'box'], ['6️⃣', 'six']],
  Y: [['🟡', 'yellow'], ['🧶', 'yarn']], Z: [['🤐', 'zip'], ['0️⃣', 'zero']],
};
// every [emoji, word] for a letter, the main one first
export const wordsFor = (L) => { const e = ABC.find((x) => x[0] === L); return [[e[1], e[2]], ...(ABC_MORE[L] || [])]; };
export const COUNT_THINGS = [
  ['🐑', 'sheep', 'sheep'], ['🎈', 'balloon', 'balloons'], ['🍎', 'apple', 'apples'], ['⭐', 'star', 'stars'], ['🐟', 'fish', 'fish'],
  ['🦆', 'duck', 'ducks'], ['🚗', 'car', 'cars'], ['🌸', 'flower', 'flowers'], ['🐶', 'puppy', 'puppies'], ['🍓', 'strawberry', 'strawberries'],
  ['🦕', 'dinosaur', 'dinosaurs'], ['🐘', 'elephant', 'elephants'], ['🫧', 'bubble', 'bubbles'],
];
