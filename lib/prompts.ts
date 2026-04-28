/**
 * Prompt library — for the "Browse prompts" feature in chat.
 *
 * Categorized so users can scan and find what they want to ask without
 * having to think it up. Built for the moment when someone opens the chat
 * and freezes ("I don't even know what to ask").
 */

export type PromptCategory = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: 'tangerine' | 'magenta' | 'sapphire' | 'sage' | 'lemon' | 'lilac' | 'burgundy';
  prompts: string[];
};

export const PROMPT_LIBRARY: PromptCategory[] = [
  {
    id: 'just-the-basics',
    name: 'Just the basics',
    emoji: '🏈',
    description: "I don't know any of this yet.",
    color: 'tangerine',
    prompts: [
      "What's the difference between the NFL and NBA?",
      "How long is an NFL game?",
      "How long is an NBA game?",
      "What's a quarter? Why are there four?",
      "What does it mean when teams 'punt'?",
      "What's a touchdown worth?",
      "What's a field goal? How is it different from a touchdown?",
      "What's a free throw?",
      "What's a 3-pointer?",
      "What's the shot clock in basketball?",
      "What's halftime — and why is it different in NFL vs NBA?",
      "How many players are on the field/court at one time?",
      "What's a foul? Are NBA and NFL fouls different?",
      "How does possession of the ball work?",
      "What does it mean to be 'in the bonus' in basketball?",
    ],
  },
  {
    id: 'players-to-know',
    name: 'Players I should know',
    emoji: '⭐',
    description: 'The faces of the league. The famous ones.',
    color: 'magenta',
    prompts: [
      "Who is Patrick Mahomes?",
      "Who is Travis Kelce?",
      "Who is Josh Allen?",
      "Who is Joe Burrow?",
      "Who is Lamar Jackson?",
      "Who is Justin Jefferson?",
      "Who is Saquon Barkley?",
      "Who is Caleb Williams?",
      "Who is LeBron James?",
      "Who is Stephen Curry?",
      "Who is Nikola Jokic?",
      "Who is Shai Gilgeous-Alexander?",
      "Who is Victor Wembanyama?",
      "Who is Jayson Tatum?",
      "Who is Luka Doncic?",
      "Who is Anthony Edwards?",
      "Who is Joel Embiid?",
      "Who is Giannis Antetokounmpo?",
      "Who is Kevin Durant — and why is he always in drama?",
      "Who is Jalen Brunson?",
    ],
  },
  {
    id: 'the-drama',
    name: 'The drama',
    emoji: '👀',
    description: "Off-field beef, group chats, scandals, and tea.",
    color: 'magenta',
    prompts: [
      "Why does KD keep getting caught running burner accounts?",
      "What's the deal with Travis Kelce and Taylor Swift?",
      "Who are the most-hated teams in each league?",
      "What was the Luka trade and why was it shocking?",
      "Why is Jerry Jones always in the news?",
      "What are 'burner accounts' and why is KD known for them?",
      "Who are the NFL's most polarizing players?",
      "Why do the Cowboys never make the Super Bowl?",
      "What's the Bill Belichick situation?",
      "What's happening with the Aaron Rodgers / Jets saga?",
      "Why is Brittany Mahomes a polarizing figure?",
      "Why is Olivia Culpo's wedding the most-discussed NFL event?",
      "What's the Kelce family podcast?",
      "Who's the LeBron family — Bronny, Bryce, Savannah?",
      "What's the Knicks' 'Brunson era' about?",
      "Why is Pat Riley terrifying?",
      "What's Andy Reid's deal with cheeseburgers?",
      "Who's the most underrated player in the NFL right now?",
      "What's the Tua Tagovailoa concussion story?",
      "Why do fans hate the Patriots historically?",
    ],
  },
  {
    id: 'fantasy',
    name: 'Fantasy 101',
    emoji: '🎯',
    description: "I want to play. Or I'm in a league and confused.",
    color: 'sapphire',
    prompts: [
      "How does fantasy football work?",
      "What's a draft?",
      "What positions do I draft in fantasy football?",
      "What's PPR scoring vs standard?",
      "What's a 'sleeper' pick?",
      "How do trades work in fantasy?",
      "What's the 'waiver wire'?",
      "When should I pick a quarterback?",
      "How does fantasy basketball work?",
      "What's a 'category' league in fantasy basketball?",
      "How do I prep for a fantasy draft?",
      "What's a flex spot?",
      "Should I draft a kicker early?",
      "What's the difference between standard and dynasty leagues?",
      "How do I win a fantasy league?",
    ],
  },
  {
    id: 'whats-happening-now',
    name: "What's happening now",
    emoji: '🔥',
    description: 'Current storylines and recent news.',
    color: 'tangerine',
    prompts: [
      "What's the biggest NFL storyline this week?",
      "What's the biggest NBA storyline this week?",
      "Who's hot right now in the NFL?",
      "Who's hot right now in the NBA?",
      "What was the most recent big trade?",
      "Which team is suddenly everyone's favorite?",
      "What's the worst team this season and why?",
      "Who's the surprise rookie this year?",
      "What's the latest QB controversy?",
      "Who's leading the MVP race in the NFL?",
      "Who's leading the MVP race in the NBA?",
      "What teams are tanking right now?",
      "What's the best storyline going into the playoffs?",
      "Which coach is on the hot seat?",
      "What's the most-shared NBA Twitter moment from last week?",
    ],
  },
  {
    id: 'history',
    name: 'History & dynasties',
    emoji: '🏆',
    description: 'The long arc — championships, eras, GOATs.',
    color: 'lemon',
    prompts: [
      "Who's the GOAT of the NFL?",
      "Who's the GOAT of the NBA?",
      "What's the Brady vs Manning debate?",
      "What's the LeBron vs MJ debate?",
      "What was the Showtime Lakers era?",
      "What were the 90s Bulls about?",
      "Who are the great NFL dynasties?",
      "Who are the great NBA dynasties?",
      "What was 'The Dream Team'?",
      "What was the 'Tuck Rule' game?",
      "Why is the 1985 Bears defense a legend?",
      "Who's the best pure shooter in NBA history?",
      "Why is Jim Brown still talked about?",
      "What's the 'Steel Curtain'?",
      "What was the 'We Believe' Warriors?",
    ],
  },
  {
    id: 'rules-im-too-afraid-to-ask',
    name: "Rules I'm too afraid to ask",
    emoji: '🤔',
    description: "Things you assume everyone knows but don't.",
    color: 'sage',
    prompts: [
      "Why does the QB sometimes 'spike' the ball?",
      "What does 'in the red zone' mean?",
      "What's a 'pick six'?",
      "What's a 'safety' (the score, not the position)?",
      "Why is offensive holding always called?",
      "What's pass interference?",
      "What's targeting? Why does it eject players?",
      "What's a backcourt violation in basketball?",
      "What's a technical foul?",
      "What's a flagrant foul?",
      "How does overtime work in the NFL?",
      "How does overtime work in the NBA?",
      "What's a 'goaltend' — and why do refs sometimes blow it?",
      "What's an illegal screen?",
      "What does 'discount double-check' mean?",
      "Why do they review plays so often now?",
    ],
  },
  {
    id: 'culture',
    name: 'Culture & meta',
    emoji: '🎬',
    description: 'The beef. The memes. The internet stuff.',
    color: 'lilac',
    prompts: [
      "Why is NBA Twitter so toxic?",
      "What's 'Skip Bayless takes' as a genre?",
      "What's the 'Pat McAfee Show'?",
      "Why is everyone obsessed with 'tunnel fits'?",
      "What's a 'lock of the week'?",
      "What's the deal with sports betting taking over?",
      "What's 'load management' and why do fans hate it?",
      "What's a 'super team' and why does the league hate them?",
      "What's tampering — and why is everyone always doing it?",
      "What's a 'media day' and why do fans care?",
      "Why are postgame outfits a whole thing?",
      "What does 'process' mean as a meme (Trust the Process)?",
      "Why do players hate WNBA / NBA player comparisons?",
      "What's 'analytics ball' and why do old-school fans hate it?",
      "Who's the most-meme'd NFL player?",
    ],
  },
  {
    id: 'team-questions',
    name: 'Specific team questions',
    emoji: '🏟️',
    description: 'Tell me about a team I want to follow.',
    color: 'burgundy',
    prompts: [
      "Tell me about the Kansas City Chiefs.",
      "Tell me about the Buffalo Bills.",
      "Tell me about the Detroit Lions.",
      "Tell me about the Philadelphia Eagles.",
      "Tell me about the Boston Celtics.",
      "Tell me about the Oklahoma City Thunder.",
      "Tell me about the Los Angeles Lakers.",
      "Tell me about the New York Knicks.",
      "Tell me about the Denver Nuggets.",
      "Tell me about the San Antonio Spurs.",
      "What's the deal with the Cowboys?",
      "What's the deal with the Patriots post-Brady?",
      "What's the Jets curse?",
      "Why are the Saints in cap hell?",
      "What's the deal with the Lakers being 'America's team' in basketball?",
    ],
  },
];

/**
 * Flat list of all prompts (handy for search / random).
 */
export function allPrompts(): { text: string; categoryId: string; category: string }[] {
  const out: { text: string; categoryId: string; category: string }[] = [];
  for (const cat of PROMPT_LIBRARY) {
    for (const p of cat.prompts) {
      out.push({ text: p, categoryId: cat.id, category: cat.name });
    }
  }
  return out;
}

/**
 * A small curated set for the empty-chat starter prompts (6 picks).
 * Hand-picked to be the most-impressive demo answers.
 */
export const STARTER_PROMPTS = [
  "What's a sack?",
  "Why does KD keep getting caught running burner accounts?",
  "How does the salary cap work?",
  "What's the trade deadline?",
  "How does fantasy football work?",
  "Who is Travis Kelce?",
];

/**
 * Returns a random handful of prompts — useful for "Surprise me" buttons.
 */
export function randomPrompts(n = 4): string[] {
  const all = allPrompts().map((p) => p.text);
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
