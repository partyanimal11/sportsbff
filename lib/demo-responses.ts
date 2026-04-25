/**
 * Demo-mode response library.
 *
 * Activates when OPENAI_API_KEY isn't set. Pattern-matches the user's question
 * against a small library of pre-written answers, with lens-aware variants
 * for the Big Six show flavors. This lets us play with the chat experience
 * without paying for tokens.
 *
 * When OPENAI_API_KEY is set, this file is bypassed entirely — the real
 * model takes over.
 */

import type { Lens } from './lens';

type LensVariant = Partial<Record<string, string>> & { default: string };
type DemoEntry = {
  id: string;
  /** Keywords / phrases that trigger this entry. Order matters — first match wins. */
  triggers: string[];
  /** League this is about (helps in retrieval ranking). */
  league?: 'nfl' | 'nba';
  /** Per-lens answers. Use 'default' for any lens not specifically authored. */
  variants: LensVariant;
};

const ENTRIES: DemoEntry[] = [
  {
    id: 'sack',
    triggers: ['sack', "what's a sack", 'what is a sack'],
    league: 'nfl',
    variants: {
      default:
        "A **sack** is when a defender catches the quarterback before he can throw the ball — and it costs the offense yards. The play ends right there, behind the line of scrimmage.\n\nThink of it as the QB being interrupted mid-sentence, except the sentence was a touchdown pass.",
      'gossip-girl':
        "A **sack** is when the defender catches the quarterback before he can throw — like Dan getting outed as Gossip Girl in the finale. The play ends right there. The QB lost yards. *Spotted: a quarterback in the dirt.*",
      succession:
        "A **sack** is the moment Logan Roy walks in unannounced. The QB had a plan. The defender had a better one. Now the QB is on the floor losing yards. Tom would call it a Tomlette.",
      bridgerton:
        "A **sack** is when an uninvited suitor arrives at your dinner table mid-proposal. The QB was nearly engaged. Then a defender — Anthony Bridgerton energy — entered the room and ended the courtship. The play is over. Yards lost.",
      euphoria:
        "A **sack** is Nate walking up uninvited to whatever Cassie was about to do. The QB was about to throw something beautiful. The defensive end (the Nate of the moment) got there first. Slow zoom on the helmet. The crowd gasps.",
      'mean-girls':
        "A **sack** is Regina George finding out you've been sitting at a different lunch table. The QB had a plan. Regina had better intel. He goes down behind the line. The Plastics dance to Jingle Bell Rock. The play is over.",
      'love-island':
        "A **sack** is a recoupling gone wrong. The QB chose his pass. The defender chose to go to him instead. The QB is now on the grass, contemplating his choices. *And just like that, the play ends in shame.*",
    },
  },
  {
    id: 'kd-gossip-girl',
    triggers: ['kd', 'kevin durant', 'gossip girl', 'gethigher', 'burner'],
    league: 'nba',
    variants: {
      default:
        "**Kevin Durant** has been running anonymous burner accounts for nine years — most recently @gethigher77 — calling out his own teammates from inside the locker room. Same outsider energy as Dan Humphrey. Same control of the narrative. Same eventual mask-slip.\n\nLonely Boy never left Brooklyn. KD never left the group chat.",
      'gossip-girl':
        "Because it's **true**. Dan Humphrey ran an anonymous blog for six seasons and nobody stopped him. Kevin Durant has been running burner accounts for nine years — most recently @gethigher77 — calling out his own teammates from inside the locker room. Same outsider energy. Same control of the narrative. Same eventual mask-slip moment.\n\nLonely Boy never left Brooklyn. KD never left the group chat.\n\nXOXO.",
    },
  },
  {
    id: 'trade-deadline',
    triggers: ['trade deadline', 'tradedeadline', 'february trade'],
    league: 'nba',
    variants: {
      default:
        "The **NBA trade deadline** is the date in February when teams can stop trading players. Once it passes, your roster is locked for the playoff push. Most of the year, trades happen quietly. The week before the deadline? Chaos.\n\nIt's the most-watched non-game day in the league.",
      'love-island':
        "It's a **recoupling**. Once a year, every player is in the villa. The producers (front offices) have been quietly arranging swaps for weeks. At 3pm ET, the texts go out. Some players are dumped. Some get a glow-up. Iain Stirling does a voiceover. NBA Twitter reacts like they personally know these people.\n\n*I got a text!*",
      bridgerton:
        "The **trade deadline** is the closing of the Marriage Mart for the season. Teams have been courting each other for months. On the appointed day, the matches are made — or not. After that, the suitors who remain unattached must wait until next year. The Queen's court watches.",
    },
  },
  {
    id: 'salary-cap',
    triggers: ['salary cap', 'cap space', 'luxury tax', 'salarycap'],
    variants: {
      default:
        "The **salary cap** is the maximum a team can spend on player salaries in a season. Both leagues have one. Stars take a huge chunk; the rest is what you have left to fill out the roster.\n\nGo over the cap and you pay a **luxury tax** to the league. Some owners pay it gladly. Others won't even sniff it.",
      bridgerton:
        "The **salary cap** is your dowry. Each team gets the same amount each year. They cannot exceed it without paying the Queen (a luxury tax). Some teams court the Diamond of the Season — an MVP — by spending almost the whole dowry on her. Others diversify into three suitable cousins.\n\n**Cap space** is what's left in the dowry. It is the most powerful currency in the league.",
      'corporate-girlie':
        "The **salary cap** is your annual headcount budget. The **luxury tax** is when finance approves overtime, but only if you're hitting OKRs. Your **cap space** is what's still in the budget at the end of Q3 — and yes, you have to spend it before fiscal year-end.\n\nLooping in finance.",
    },
  },
  {
    id: 'mvp',
    triggers: ['mvp', 'most valuable player'],
    variants: {
      default:
        "The **MVP** is the Most Valuable Player. Awarded once a year by ~100 sportswriters. The MVP is rarely the *best* player — it's usually the player whose **narrative** is the best.\n\nThink of it like Best Picture. It's the one the room agreed to make a moment of.",
      bridgerton:
        "The **MVP** is the **Diamond of the Season**. The trophy. The face on every cover. Everyone says they want her. Most teams could not afford the courtship. The Queen (Adam Silver) declares the Diamond at season's end.",
      'gossip-girl':
        "The **MVP** is the It Girl of the season. The one everyone's writing about. The one the press won't shut up about. Sometimes she deserves it. Sometimes she's just the one Gossip Girl decided to crown. *You know you love her.*",
    },
  },
  {
    id: 'fantasy-football',
    triggers: ['fantasy', 'fantasy football', 'how does fantasy work'],
    league: 'nfl',
    variants: {
      default:
        "**Fantasy football** is a season-long game. You and 9-11 friends draft real NFL players in the late summer. Each week, you pick which of your players will start. Their real-life stats earn you points.\n\nMost leagues meet for a draft (a 2-3 hour event). Then it's a 17-week season. Trash talk is the actual sport.\n\nIt's the easiest way to get into football, fast.",
      'love-island':
        "**Fantasy** is Casa Amor, year-round. You draft the players you like (the ones you'd couple up with). You set your lineup each week (your villa). You trash-talk your friends. You can trade. You can drop people who aren't bringing it. There's a salary cap, kind of.\n\nBy week six you'll know more about wide receivers than you wanted to. *I got a text!*",
    },
  },
  {
    id: 'travis-kelce',
    triggers: ['travis kelce', '#87', 'kelce', 'taylor swift kelce'],
    league: 'nfl',
    variants: {
      default:
        "**Travis Kelce**: tight end for the Kansas City Chiefs. Three Super Bowl rings. Future Hall of Famer. Co-hosts the New Heights podcast with his older brother Jason. And yes — partner of Taylor Swift since 2023.\n\nHe's the most famous tight end ever, partly because he's that good and partly because the Eras Tour cameos broke the internet.",
    },
  },
  {
    id: 'pick-and-roll',
    triggers: ['pick and roll', 'pick-and-roll', 'pnr', "what's a pick"],
    league: 'nba',
    variants: {
      default:
        "The **pick-and-roll** is basketball's most-used play. Player A (the **screener**) plants his body in the path of Player B's defender, freeing Player B (usually a guard with the ball) to drive or shoot. Then Player A **rolls** to the basket — open for a pass.\n\nIt's two players doing the work of five. Steve Nash made a career of it. Jokic is its current grand master.",
    },
  },
  {
    id: 'who-is-mahomes',
    triggers: ['mahomes', 'patrick mahomes'],
    league: 'nfl',
    variants: {
      default:
        "**Patrick Mahomes**: Kansas City Chiefs quarterback. The face of the league. Three-time Super Bowl MVP at age 30. Married his high-school sweetheart Brittany. Throws side-arm passes that look like physics violations.\n\nIf the NFL had a king, it'd be him.",
    },
  },
  {
    id: 'who-is-sga',
    triggers: ['sga', 'shai gilgeous-alexander', 'shai gilgeous'],
    league: 'nba',
    variants: {
      default:
        "**Shai Gilgeous-Alexander**: Oklahoma City Thunder guard. Reigning MVP. Quietly the most-respected player in the league. Tailored cardigans postgame. Two-word answers. Says everything with his chest.\n\nChuck Bass energy.",
      'gossip-girl':
        "**Shai Gilgeous-Alexander** is the **Chuck Bass of the NBA**. Quiet menace. Immaculately dressed. Never explains himself. Says everything with his chest. 'I'm Chuck Bass' = 'I'm the MVP' — same sentence, same energy.\n\nReigning MVP. The face of the Oklahoma City Thunder. Tailored cardigans postgame. Two-word answers.\n\nXOXO.",
    },
  },
  {
    id: 'who-is-wemby',
    triggers: ['wemby', 'wembanyama', 'victor wembanyama'],
    league: 'nba',
    variants: {
      default:
        "**Victor Wembanyama**: 7'4 French unicorn. San Antonio Spurs center. Defensive Player of the Year favorite. Plays like LeBron and Dirk had a child raised by Gregg Popovich.\n\nHe is the future of the sport.",
    },
  },
  {
    id: 'who-is-josh-allen',
    triggers: ['josh allen'],
    league: 'nfl',
    variants: {
      default:
        "**Josh Allen**: Buffalo Bills quarterback. Reigning MVP. 6'5, 240 pounds. Throws fastballs. Dating Hailee Steinfeld. The avatar of the Bills Mafia (the table-jumping fans).\n\nAlways loses to Mahomes in January. The 13-second collapse will haunt him forever.",
    },
  },
  {
    id: 'first-down',
    triggers: ['first down', '1st down', "what's a first down"],
    league: 'nfl',
    variants: {
      default:
        "A **first down** is when the offense moves the ball at least 10 yards. They get four tries (called **downs**) to do it. If they make it: fresh set of downs, four more tries.\n\nIf they don't: they have to give the ball to the other team — usually by punting it away on 4th down.\n\nThis is how the entire game advances.",
    },
  },
];

/**
 * Match a user message against the demo library.
 * Returns the best lens-flavored answer, or null if nothing matched.
 */
export function findDemoAnswer(message: string, lensId: string): string | null {
  const m = message.toLowerCase();
  for (const entry of ENTRIES) {
    if (entry.triggers.some((t) => m.includes(t))) {
      return entry.variants[lensId] ?? entry.variants.default;
    }
  }
  return null;
}

/**
 * Fallback when no entry matches. Inviting, never feels like an error.
 */
export function demoFallback(lensId: string): string {
  const lensName = lensId
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
  return [
    "I'm running in **demo mode** right now — no AI key wired up yet. Once we plug OpenAI in, I'll be your real sports BFF and answer anything you throw at me.",
    '',
    'For now, try one of these:',
    '',
    "- *What's a sack?*",
    "- *Why is everyone saying KD is Gossip Girl?*",
    "- *How does the salary cap work?*",
    "- *What's the trade deadline?*",
    "- *How does fantasy football work?*",
    '',
    `(Currently in the **${lensName}** lens.)`,
  ].join('\n');
}

/**
 * Async helper that simulates streaming for the demo mode.
 * Yields chunks of ~3 words at a time.
 */
export async function* streamDemoAnswer(answer: string, delayMs = 22) {
  const tokens = answer.split(/(\s+)/);
  let buf = '';
  for (let i = 0; i < tokens.length; i++) {
    buf += tokens[i];
    if (i % 4 === 3 || i === tokens.length - 1) {
      yield buf;
      buf = '';
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}
