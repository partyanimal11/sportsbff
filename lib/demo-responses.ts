/**
 * Demo-mode response library.
 *
 * Activates when OPENAI_API_KEY isn't set. Pattern-matches the user's question
 * against a small library of pre-written answers, with optional Euphoria-flavored
 * variants. (Other show lenses retired — Euphoria is the one prestige-TV lens.)
 *
 * When OPENAI_API_KEY is set, this file is bypassed entirely — the real
 * model takes over.
 */

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
  // ─────────── NFL: rules + plays ───────────
  {
    id: 'sack',
    triggers: ['sack', "what's a sack", 'what is a sack'],
    league: 'nfl',
    variants: {
      default:
        "A **sack** is when a defender catches the quarterback before he can throw the ball — and it costs the offense yards. The play ends right there, behind the line of scrimmage.\n\nThink of it as the QB being interrupted mid-sentence, except the sentence was a touchdown pass.",
      euphoria:
        "A **sack** is Nate walking up uninvited to whatever Cassie was about to do. The QB was about to throw something beautiful. The defensive end (the Nate of the moment) got there first. Slow zoom on the helmet. The crowd gasps.",
    },
  },
  {
    id: 'first-down',
    triggers: ['first down', '1st down', "what's a first down"],
    league: 'nfl',
    variants: {
      default:
        "A **first down** is when the offense moves the ball at least 10 yards. They get four tries (called **downs**) to do it. If they make it: fresh four tries. If they don't: they have to give the ball to the other team — usually by punting on 4th down.\n\nThis is how the entire game advances.",
    },
  },
  {
    id: 'touchdown',
    triggers: ['touchdown', "what's a touchdown", 'how do you score'],
    league: 'nfl',
    variants: {
      default:
        "A **touchdown** is the big one. Six points. You get one when you carry or catch the ball into the other team's end zone (the painted area at each end of the field).\n\nAfter you score, you almost always kick a 1-point extra point. Sometimes teams 'go for two' instead — try to score from 2 yards out — for two points. Riskier, used when you need to catch up.",
    },
  },
  {
    id: 'field-goal',
    triggers: ['field goal', 'fg', 'kick', 'extra point'],
    league: 'nfl',
    variants: {
      default:
        "A **field goal** is when the kicker boots the ball through the upright posts at the end of the field. Worth 3 points. Used when the offense gets close but stalls.\n\nAn **extra point** is the small kick after a touchdown. Worth 1 point. Almost always good — kickers make ~95% of them.",
    },
  },
  {
    id: 'fumble',
    triggers: ['fumble'],
    league: 'nfl',
    variants: {
      default:
        "A **fumble** is when the player carrying the ball drops it (or has it knocked out). Whoever picks it up first owns it. If the defense recovers, possession flips immediately and the crowd loses its mind.",
    },
  },
  {
    id: 'interception',
    triggers: ['interception', 'pick'],
    league: 'nfl',
    variants: {
      default:
        "An **interception** (also called a 'pick') is when the defense catches a pass meant for the offense. Possession flips immediately and the defender can run with the ball. Devastating when it happens. Quarterbacks who throw a lot of them lose their jobs.",
    },
  },
  {
    id: 'punt',
    triggers: ['punt', 'punter'],
    league: 'nfl',
    variants: {
      default:
        "A **punt** is when the offense kicks the ball away to the other team — usually on 4th down when they couldn't get the first down. It's a strategic surrender: you give up the ball but you push the other team back, so they have farther to drive.\n\nIt's the football equivalent of *'we're going to need to start over next round.'*",
    },
  },
  {
    id: 'fantasy-football',
    triggers: ['fantasy', 'fantasy football', 'how does fantasy work'],
    league: 'nfl',
    variants: {
      default:
        "**Fantasy football** is a season-long game. You and 9-11 friends draft real NFL players in late August. Each week, you pick which of your players will start. Their real-life stats earn you points.\n\nMost leagues meet for a draft (a 2-3 hour event). Then it's a 17-week season. Trash talk is the actual sport.\n\nIt's the easiest way to get into football, fast.",
    },
  },
  {
    id: 'super-bowl',
    triggers: ['super bowl', 'superbowl', 'sb59', 'sb 59'],
    league: 'nfl',
    variants: {
      default:
        "The **Super Bowl** is the NFL championship game. Held the second Sunday in February. Most-watched TV broadcast in America every year. Halftime show is its own cultural event. The winner gets the Lombardi Trophy.\n\nMahomes' Chiefs have been there 5 of the last 6 years. They've won 3.",
    },
  },
  {
    id: 'playoffs-nfl',
    triggers: ['playoffs', 'wild card', 'playoff format', 'how do playoffs work'],
    league: 'nfl',
    variants: {
      default:
        "After the regular season, **14 teams make the playoffs** (7 from each conference: AFC + NFC). Each conference plays a single-elimination bracket — Wild Card → Divisional → Conference Championship → Super Bowl.\n\nThe top seed in each conference gets a first-round bye (skips Wild Card weekend). Lose once, you're out.",
    },
  },

  // ─────────── NFL: players ───────────
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
    id: 'who-is-mahomes',
    triggers: ['mahomes', 'patrick mahomes'],
    league: 'nfl',
    variants: {
      default:
        "**Patrick Mahomes**: Kansas City Chiefs quarterback. The face of the league. Three-time Super Bowl MVP at age 30. Married his high-school sweetheart Brittany. Throws side-arm passes that look like physics violations.\n\nIf the NFL had a king, it'd be him.",
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
    id: 'who-is-jefferson',
    triggers: ['justin jefferson'],
    league: 'nfl',
    variants: {
      default:
        "**Justin Jefferson**: Minnesota Vikings wide receiver. Best WR in football. Hits the Griddy after every touchdown — that's his celebration. Highest-paid non-QB in NFL history.\n\nStuck on a franchise that never figures out the QB position.",
    },
  },
  {
    id: 'who-is-saquon',
    triggers: ['saquon', 'saquon barkley'],
    league: 'nfl',
    variants: {
      default:
        "**Saquon Barkley**: Eagles running back. Won a Super Bowl in his first year there. Spent 6 years with the Giants who refused to pay him — then he signed with their division rival and became unstoppable.\n\nIt's the great franchise gaffe of the decade.",
    },
  },

  // ─────────── NBA: rules + plays ───────────
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
    id: 'salary-cap',
    triggers: ['salary cap', 'cap space', 'luxury tax', 'salarycap'],
    variants: {
      default:
        "The **salary cap** is the maximum a team can spend on player salaries in a season. Both leagues have one. Stars take a huge chunk; the rest is what you have left to fill out the roster.\n\nGo over the cap and you pay a **luxury tax** to the league. Some owners pay it gladly. Others won't even sniff it.",
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
    },
  },
  {
    id: 'trade-deadline',
    triggers: ['trade deadline', 'tradedeadline', 'february trade'],
    league: 'nba',
    variants: {
      default:
        "The **NBA trade deadline** is the date in February when teams can stop trading players. Once it passes, your roster is locked for the playoff push. Most of the year, trades happen quietly. The week before the deadline? Chaos.\n\nIt's the most-watched non-game day in the league.",
    },
  },
  {
    id: 'three-pointer',
    triggers: ['three pointer', 'three-pointer', '3-pointer', 'three point line', 'three'],
    league: 'nba',
    variants: {
      default:
        "A **three-pointer** is any shot made from outside the curved arc on the floor (about 24 feet from the hoop). Worth 3 points instead of 2. Modern teams shoot way more of them than they used to — the math is too good to ignore.\n\nSteph Curry made it the defining shot of this era.",
    },
  },
  {
    id: 'free-throw',
    triggers: ['free throw', 'foul shot', 'and one'],
    league: 'nba',
    variants: {
      default:
        "A **free throw** is the unguarded shot you get from the foul line when the other team fouls you. Worth 1 point. You usually get 2 (one for each illegal contact).\n\n**'And-one'** is when you score a basket AND get fouled at the same time — you get the points and one free throw. Crowd loses it.",
    },
  },
  {
    id: 'triple-double',
    triggers: ['triple-double', 'triple double'],
    league: 'nba',
    variants: {
      default:
        "A **triple-double** is when one player hits 10+ in three statistical categories in one game — usually points, rebounds, and assists. Like getting an A in three classes in the same week.\n\nNikola Jokic averages one. So does Russell Westbrook (who has the most ever).",
    },
  },
  {
    id: 'foul-out',
    triggers: ['foul out', 'fouled out', 'six fouls'],
    league: 'nba',
    variants: {
      default:
        "Each player gets **6 personal fouls** before they're disqualified for the rest of the game ('fouling out'). Star players play scared once they have 4 — coaches sub them out so they don't risk a 5th and 6th.",
    },
  },

  // ─────────── NBA: players ───────────
  {
    id: 'kd-burner',
    triggers: ['kd', 'kevin durant', 'gethigher', 'burner'],
    league: 'nba',
    variants: {
      default:
        "**Kevin Durant** has been running anonymous burner accounts for nine years — most recently @gethigher77 — calling out his own teammates and replying to fans from inside the locker room. The mask-slip moments are legendary. He's the most-discussed personality in the league for reasons that have very little to do with basketball.\n\nThe man cannot stop logging on.",
    },
  },
  {
    id: 'who-is-sga',
    triggers: ['sga', 'shai gilgeous-alexander', 'shai gilgeous'],
    league: 'nba',
    variants: {
      default:
        "**Shai Gilgeous-Alexander**: Oklahoma City Thunder guard. Reigning MVP. Quietly the most-respected player in the league. Tailored cardigans postgame. Two-word answers. Says everything with his chest.\n\nThe quiet menace of the league.",
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
    id: 'who-is-jokic',
    triggers: ['jokic', 'nikola jokic'],
    league: 'nba',
    variants: {
      default:
        "**Nikola Jokic**: Denver Nuggets center. Three-time MVP. Greatest passing big man ever. Loves his horses more than basketball. Wins championships and goes home.\n\nThe most calm superstar in any sport. Doesn't want any of this.",
    },
  },
  {
    id: 'who-is-lebron',
    triggers: ['lebron', 'lebron james'],
    league: 'nba',
    variants: {
      default:
        "**LeBron James**: Lakers forward. The King. Four-time NBA Champion. Career scoring leader (most points in NBA history).\n\nHe plays alongside his son Bronny — the first father-son NBA duo. He's 41. Still plays 35+ minutes a night. Will retire when he wants to.",
    },
  },
  {
    id: 'who-is-tatum',
    triggers: ['tatum', 'jayson tatum'],
    league: 'nba',
    variants: {
      default:
        "**Jayson Tatum**: Boston Celtics forward. Won the 2024 NBA Championship. The first overall #3 pick in his draft class to win one.\n\nTook six years to get the ring. Critics still whisper about him. Calm in spite of it.",
    },
  },
  {
    id: 'who-is-luka',
    triggers: ['luka', 'luka doncic'],
    league: 'nba',
    variants: {
      default:
        "**Luka Doncic**: Lakers guard. Generational scorer. Was the Mavericks' face for 6 seasons.\n\nThen, in 2025, the Mavs traded him to the Lakers in the most shocking deal in modern NBA history. Mavs fans haven't recovered. Lakers fans are the happiest people on Earth.",
    },
  },
  {
    id: 'who-is-curry',
    triggers: ['curry', 'steph', 'stephen curry'],
    league: 'nba',
    variants: {
      default:
        "**Stephen Curry**: Golden State Warriors point guard. Four-time NBA Champion. The greatest shooter who has ever lived.\n\nHe didn't invent the three-pointer. He made it the most important shot in basketball. Dell (his dad) and Sonya are the original NBA family.",
    },
  },
  {
    id: 'who-is-jokic-team',
    triggers: ['nuggets', 'who is the nuggets'],
    league: 'nba',
    variants: {
      default:
        "The **Denver Nuggets** are Nikola Jokic's team. Won the 2023 NBA Championship. Built around Jokic's passing and Jamal Murray's clutch shotmaking.\n\nThey play in Denver, the highest-altitude arena in the league. Visiting teams literally can't breathe by the 4th quarter.",
    },
  },

  // ─────────── Cross-league + meta ───────────
  {
    id: 'how-to-watch',
    triggers: ['how do i watch', 'where to watch', 'what channel'],
    variants: {
      default:
        "**NFL**: Sunday afternoons (1pm + 4pm ET) on FOX, CBS, NBC. Sunday Night Football on NBC. Monday Night Football on ESPN. Thursday Night Football on Amazon Prime.\n\n**NBA**: Most nights, mostly on ESPN, TNT, NBA TV, and league pass for everything. The Finals are on ABC.\n\nA cable subscription is annoying. League Pass + a YouTube TV trial covers most of it.",
    },
  },
  {
    id: 'why-do-people-care',
    triggers: ['why do people care', 'why is this important'],
    variants: {
      default:
        "Honestly? Same reason people care about prestige TV.\n\nIt's a long-running story with characters you start to know. There are heroes, villains, redemption arcs, betrayals, dynasties, underdogs. The plot updates in real time. The drama is real.\n\nOnce you know the players, you can't stop watching.",
    },
  },
];

export type LensId = string;

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
    "- *Who is Travis Kelce?*",
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
