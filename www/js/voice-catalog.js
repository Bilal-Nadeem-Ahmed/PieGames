// Everything the games can say, grouped for the Voices screen and the recording checklist (docs/VOICE_CLIPS.md).
const L = (s) => s.split('|');
// What the app can say, grouped for the grown-ups' Voices screen and the recording checklist.
export const CATALOG = [
  ['Praise', L('yay|wow|well done|good job|excellent|brilliant|amazing|super|hooray|you did it|all done|level up')],
  ['Hello and no', L('hello|Pie Game|oops|try again|no thank you|nobody here|yes|yum|peekaboo')],
  ['Numbers', Array.from({ length: 20 }, (_, i) => String(i + 1))],
  ['Letters', Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))],
  ['Colours', L('red|orange|yellow|green|blue|purple|pink|white|brown|black|rainbow')],
  ['Shapes', L('circle|square|triangle|star|heart|moon|diamond')],
  ['Animals', L('dog|cat|cow|sheep|lamb|duck|elephant|horse|chicken|lion|frog|monkey|bunny|bear|tiger|fish|owl|dinosaur|ladybird|penguin|puppy|kitten')],
  ['Animal noises', L('woof woof|meow|baa|moo|quack|roar|ribbit|neigh|cluck|hoot')],
  ['A is for…', L('apple|balloon|grapes|house|ice cream|juice|kite|nose|queen|tree|umbrella|van|whale|fox|yo-yo|zebra')],
  ['Counting words', L('apples|balloons|stars|ducks|cars|flowers|strawberries|dinosaurs|elephants|bubbles|ladybirds|puppies')],
  ['Little words', L("is for|that's|where's the|find|pop the|trace the|how many|let's count|number|letter|pop|bubble|jumping")],
  ['Game openers', L("Tap the eggs|Who's hiding|What shall we build|Find the pairs|Help the sheep into the pen|Find the ladybirds|Feed the animals|Put the shapes in|Do the puzzle|Tap to jump|3, 2, 1, blast off")],
  ['Pet', L("I'm hungry|let's play|sleepy|bath time|night night|good morning|I love you|tickle|bigger")],
];
