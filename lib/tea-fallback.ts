/**
 * Evergreen Tea fallback pack.
 *
 * Used when /api/today fails, rate-limits, or runs without an OpenAI key.
 * 10 hand-authored 3-card packs covering NFL + NBA + both, in different
 * lens voices. We pick the closest match by (lens, league) — falling back
 * to a "plain" pack as the last resort.
 */

export type TeaCard = {
  drama: { prompt: string; response: string };
  players: { id: string; name: string; team: string; league: 'nfl' | 'nba'; number: number }[];
  lesson: { title: string; body: string };
};

export type TeaFallback = {
  lens: string;
  league: 'nfl' | 'nba' | 'both';
  card: TeaCard;
};

export const TEA_FALLBACK: TeaFallback[] = [
  // ─────────── PLAIN — universal default ───────────
  {
    lens: 'plain',
    league: 'both',
    card: {
      drama: {
        prompt: "What's the biggest sports story right now?",
        response:
          "The NBA's biggest ongoing storyline is **Luka Doncic in a Lakers jersey** — the most-shocking trade in modern league history is still rippling. Mavs traded the reigning Finals MVP to LA in February 2025 for Anthony Davis, and the franchise is still recovering. On the NFL side, **the Chiefs' three-peat hunt** continues to dominate every conversation — Patrick Mahomes is chasing back-to-back-to-back Super Bowls, something only the Packers (1965-67) have ever done.",
      },
      players: [
        { id: 'luka-doncic', name: 'Luka Doncic', team: 'lal', league: 'nba', number: 77 },
        { id: 'patrick-mahomes', name: 'Patrick Mahomes', team: 'kc', league: 'nfl', number: 15 },
        { id: 'shai-gilgeous-alexander', name: 'Shai Gilgeous-Alexander', team: 'okc', league: 'nba', number: 2 },
        { id: 'josh-allen', name: 'Josh Allen', team: 'buf', league: 'nfl', number: 17 },
      ],
      lesson: {
        title: 'The salary cap, in 60 seconds.',
        body:
          "Every team in the NFL and NBA has a maximum amount they can spend on player salaries — that's the salary cap. It's set by the league each year based on revenue. The NFL cap (2025) is ~$255M; the NBA's is ~$141M with a luxury tax kicking in over $171M.\n\nThis matters because it's why your favorite team can't just sign every star — they'd blow the cap. It's also why the trade deadline is dramatic: teams are juggling money, not just talent. A 'cap-friendly' contract means a player is paid less than their on-court value (a steal). A 'cap killer' is the opposite.\n\nThe new NBA CBA's 'second apron' is the recent twist — go too far over the cap and you lose draft picks, trade flexibility, the whole thing. It's why the Celtics, Warriors, and Bucks are all making painful breakups right now.",
      },
    },
  },

  // ─────────── PLAIN — NBA only ───────────
  {
    lens: 'plain',
    league: 'nba',
    card: {
      drama: {
        prompt: "What's the biggest NBA story this week?",
        response:
          "**Luka Doncic in a Lakers jersey** is still the dominant storyline. Two months after Mavs GM Nico Harrison shipped the reigning Finals MVP to LA for Anthony Davis (Feb 2, 2025), the Mavericks fanbase is still grieving and Nico has been fired. Meanwhile, **SGA and the Thunder** are running the Western Conference — Oklahoma City has the best record in the NBA and Shai is on track for back-to-back MVPs. The Wemby vs. Edwards next-generation rivalry is heating up too.",
      },
      players: [
        { id: 'luka-doncic', name: 'Luka Doncic', team: 'lal', league: 'nba', number: 77 },
        { id: 'shai-gilgeous-alexander', name: 'Shai Gilgeous-Alexander', team: 'okc', league: 'nba', number: 2 },
        { id: 'victor-wembanyama', name: 'Victor Wembanyama', team: 'sas', league: 'nba', number: 1 },
        { id: 'anthony-edwards', name: 'Anthony Edwards', team: 'min', league: 'nba', number: 5 },
      ],
      lesson: {
        title: 'How an NBA playoff bracket works.',
        body:
          "After the regular season, the top 8 teams in each conference (East and West) make the playoffs. Seeds 7-10 play a 'play-in tournament' first to determine who grabs the 7th and 8th seeds.\n\nFrom there, it's four rounds of best-of-7 series:\n- Round 1: 1v8, 2v7, 3v6, 4v5\n- Round 2 (Conference Semifinals)\n- Conference Finals: the winner of each half\n- NBA Finals: East champion vs. West champion\n\nWin 16 games (4 in each round) and you're a champion. The team with the better seed gets home-court advantage — Games 1, 2, 5, 7 at home.",
      },
    },
  },

  // ─────────── PLAIN — NFL only ───────────
  {
    lens: 'plain',
    league: 'nfl',
    card: {
      drama: {
        prompt: "What's the biggest NFL story this week?",
        response:
          "**The Chiefs' three-peat hunt** is the dominant narrative — Mahomes and Reid are chasing what only the 1965-67 Packers ever did. Meanwhile **Bill Belichick's UNC experiment** is the NFL's offseason theater of the year — the GOAT NFL coach trying to rebuild a college program at 73. And **the Bengals' Joe Burrow injury timeline** is the tragic ongoing storyline — the league's most-fashionable QB can't catch a break health-wise.",
      },
      players: [
        { id: 'patrick-mahomes', name: 'Patrick Mahomes', team: 'kc', league: 'nfl', number: 15 },
        { id: 'josh-allen', name: 'Josh Allen', team: 'buf', league: 'nfl', number: 17 },
        { id: 'lamar-jackson', name: 'Lamar Jackson', team: 'bal', league: 'nfl', number: 8 },
        { id: 'jalen-hurts', name: 'Jalen Hurts', team: 'phi', league: 'nfl', number: 1 },
      ],
      lesson: {
        title: 'How the NFL season works.',
        body:
          "32 teams, split into two conferences (AFC and NFC), each with 4 divisions of 4 teams. Regular season: 17 games over 18 weeks (one bye week per team), played mostly on Sundays from September to early January.\n\nAfter Week 18, 14 teams make the playoffs (7 per conference): the 4 division winners + 3 wild cards. The #1 seed in each conference gets a first-round bye.\n\nThe playoffs are single-elimination, four rounds: Wild Card → Divisional → Conference Championship → Super Bowl. Win 3 (or 4 without the bye) and you're a champion.\n\nThe Super Bowl is played in early February at a neutral site that's chosen years in advance.",
      },
    },
  },

  // ─────────── GOSSIP GIRL — NBA ───────────
  {
    lens: 'gossip-girl',
    league: 'nba',
    card: {
      drama: {
        prompt: "What's the NBA tea this week?",
        response:
          "Spotted: a Mavericks fanbase still grieving its Diamond of the Season. Two months after **Luka Doncic** got shipped to the Lakers in the most shocking betrayal of the season, the streets of Dallas have not recovered. Nico Harrison? Disgraced. The Adelson family? Whispered about. And meanwhile in Oklahoma City, **SGA** is wearing his cardigans and quietly running the league while no one watches. **Shai is the Chuck Bass of the NBA** — quiet menace, immaculate fits, says everything with his chest. XOXO.",
      },
      players: [
        { id: 'luka-doncic', name: 'Luka Doncic', team: 'lal', league: 'nba', number: 77 },
        { id: 'shai-gilgeous-alexander', name: 'Shai Gilgeous-Alexander', team: 'okc', league: 'nba', number: 2 },
        { id: 'kevin-durant', name: 'Kevin Durant', team: 'phx', league: 'nba', number: 35 },
        { id: 'victor-wembanyama', name: 'Victor Wembanyama', team: 'sas', league: 'nba', number: 1 },
      ],
      lesson: {
        title: 'The trade deadline, decoded.',
        body:
          "Spotted: thirty general managers panicking in February. The trade deadline is the day every season when teams have to lock in their roster — after this date, no more trades until the offseason.\n\nThink of it like the Cotillion: every team is either buying (a contender adding pieces for a playoff run) or selling (a struggling team dumping veterans for draft picks and salary relief). The drama is in who got moved, who refused to be moved, and which front office got outmaneuvered in the final hours.\n\nThe deadline lives in early February. Shams Charania is the Lady Whistledown — every push notification a society scandal. The biggest deadline trades define the next two months of the season. XOXO.",
      },
    },
  },

  // ─────────── BRIDGERTON — NBA ───────────
  {
    lens: 'bridgerton',
    league: 'nba',
    card: {
      drama: {
        prompt: 'Tell me what is happening in the NBA right now.',
        response:
          "Dear reader, sources tell this author that the Western Conference Marriage Mart has been thoroughly disrupted. The **Oklahoma City Thunder** — a young house with a most-eligible Diamond in **Shai Gilgeous-Alexander** — sit atop the season's standings, having quietly outmaneuvered every more-storied family in the league. Meanwhile in the Eastern realm, the **Boston Celtics** wear the crown of the prior season and now face the inevitability of envy from every other house. **SGA is the Anthony Bridgerton of the league** — measured, tailored, refuses to lose his composure in public.",
      },
      players: [
        { id: 'shai-gilgeous-alexander', name: 'Shai Gilgeous-Alexander', team: 'okc', league: 'nba', number: 2 },
        { id: 'jayson-tatum', name: 'Jayson Tatum', team: 'bos', league: 'nba', number: 0 },
        { id: 'jalen-brunson', name: 'Jalen Brunson', team: 'nyk', league: 'nba', number: 11 },
        { id: 'victor-wembanyama', name: 'Victor Wembanyama', team: 'sas', league: 'nba', number: 1 },
      ],
      lesson: {
        title: 'On the matter of Free Agency.',
        body:
          "Each year, contracts expire and the most eligible suitors of the league become available to court. This is what is colloquially called 'free agency.'\n\nIt commences each summer (June 30 in the NBA, mid-March in the NFL) and is rather like the start of the Season — every house lays out its dowry, every Diamond chooses where to bestow her favor. The wealthier houses, of course, hold an advantage; though they are limited by the league's 'salary cap,' which functions much like a respectable family's annual income.\n\nThe outcome of free agency reshapes the next year's prospects entirely. A great house can fall by losing a single Diamond. A young house can rise by winning one. Such is the way of the ton.",
      },
    },
  },

  // ─────────── SUCCESSION — NFL ───────────
  {
    lens: 'succession',
    league: 'nfl',
    card: {
      drama: {
        prompt: 'What is the NFL drama right now?',
        response:
          "The biggest succession crisis in football is the **Chiefs' dynasty** — Mahomes and Reid are running a three-peat operation that every other franchise is trying to dismantle. Meanwhile **Bill Belichick's exile to UNC** is the saddest divorce in modern American sports — the Logan Roy of NFL coaches reduced to a college consulting role. The Cowboys remain the league's most embarrassing public-company governance disaster, with **Jerry Jones** still operating as his own GM at 81. **Jerry Jones is the Logan Roy of the NFL** — refuses to die, refuses to step down, refuses to let any of his sons actually run anything.",
      },
      players: [
        { id: 'patrick-mahomes', name: 'Patrick Mahomes', team: 'kc', league: 'nfl', number: 15 },
        { id: 'josh-allen', name: 'Josh Allen', team: 'buf', league: 'nfl', number: 17 },
        { id: 'caleb-williams', name: 'Caleb Williams', team: 'chi', league: 'nfl', number: 18 },
        { id: 'cj-stroud', name: 'C.J. Stroud', team: 'hou', league: 'nfl', number: 7 },
      ],
      lesson: {
        title: 'The franchise tag — the company\'s vesting clause.',
        body:
          "The franchise tag is the NFL's mechanism for forcing a star player to stay one more year against their will — a 1-year contract, set at the average of the top-5 salaries at that position. The team gets leverage. The player gets paid but not security.\n\nIt's a Tomlette of a tool. It says: 'we own you for one more cycle.' Players hate it because it limits their long-term earning power. Teams use it because it kicks the can down the road on a difficult negotiation.\n\nThink of it like a non-compete with a single-year carve-out. The player can still leave next year — but for one more season, they're contractually bound to the company. Boar on the floor energy.",
      },
    },
  },

  // ─────────── EUPHORIA — NFL ───────────
  {
    lens: 'euphoria',
    league: 'nfl',
    card: {
      drama: {
        prompt: 'What is happening in the NFL?',
        response:
          "Slow zoom on the helmet. **Mahomes** is chasing the three-peat — the kind of dynasty East Highland would write a yearbook about. **Caleb Williams** is in his Cassie era in Chicago, learning the league under a new offensive coordinator who actually cares. And **Joe Burrow** is the Lexi Howard of the NFL — quietly excellent, cinematically dressed, somehow always slightly injured. Every locker-room is a Maddy/Cassie standoff waiting to happen. The crowd gasps.",
      },
      players: [
        { id: 'patrick-mahomes', name: 'Patrick Mahomes', team: 'kc', league: 'nfl', number: 15 },
        { id: 'caleb-williams', name: 'Caleb Williams', team: 'chi', league: 'nfl', number: 18 },
        { id: 'joe-burrow', name: 'Joe Burrow', team: 'cin', league: 'nfl', number: 9 },
        { id: 'tyreek-hill', name: 'Tyreek Hill', team: 'mia', league: 'nfl', number: 10 },
      ],
      lesson: {
        title: 'The tunnel walk = armor.',
        body:
          "Every NFL star walks through the tunnel into the stadium pre-game wearing a curated outfit. It's not a uniform. It's armor.\n\nThe tunnel walk is the moment before everything begins. The cameras find them. The fits are scrutinized like Maddy's pre-party preparation. Every detail is intentional — the watch, the headphones, the bag, the drape of the jacket.\n\nIt's not about looking pretty. It's about walking into a place that wants to break you and saying: I already won. The crowd gasps before kickoff.",
      },
    },
  },

  // ─────────── MEAN GIRLS — NBA ───────────
  {
    lens: 'mean-girls',
    league: 'nba',
    card: {
      drama: {
        prompt: 'Spill the NBA tea.',
        response:
          "**The Boston Celtics** are the Plastics — defending the throne, reigning over the East cafeteria, on Wednesdays they wear pink. **Tatum is Regina** (the alpha), **Brown is Gretchen** (loyal but paranoid), **Jrue is Karen** (sweet and shocking when activated). Meanwhile in OKC, **SGA is the new girl who somehow runs the school** — quiet, stylish, undefeated. And the Lakers got a Kevin G named Luka. So fetch.",
      },
      players: [
        { id: 'jayson-tatum', name: 'Jayson Tatum', team: 'bos', league: 'nba', number: 0 },
        { id: 'jaylen-brown', name: 'Jaylen Brown', team: 'bos', league: 'nba', number: 7 },
        { id: 'shai-gilgeous-alexander', name: 'Shai Gilgeous-Alexander', team: 'okc', league: 'nba', number: 2 },
        { id: 'luka-doncic', name: 'Luka Doncic', team: 'lal', league: 'nba', number: 77 },
      ],
      lesson: {
        title: 'On Wednesdays we draft players.',
        body:
          "The NBA draft is the spring sorting hat for the league. The worst teams from the prior season pick first (with a lottery to discourage tanking). This is when a Cady becomes a Plastic — or stays in the math league.\n\nFour years of college ball, or one year and out (the famous 'one and done'), then the draft. First-round picks get guaranteed money. Second-rounders fight for a roster spot.\n\nThe draft happens in late June. The top pick goes to a team that needs a face. Sometimes it works (Wemby to Spurs, San Antonio gets a Diamond). Sometimes it's a Glen Coco situation (the player thrives but the team can't build around them). On Wednesdays, we pick.",
      },
    },
  },

  // ─────────── LOVE ISLAND — NFL ───────────
  {
    lens: 'love-island',
    league: 'nfl',
    card: {
      drama: {
        prompt: "What's happening in the NFL?",
        response:
          "Tonight in this villa: **Patrick Mahomes** is the alpha couple's lead, going for his third championship in a recoupling no one saw coming. Across the firepit, **Bill Belichick** has been dumped from the league and recoupled with the University of North Carolina, which is a move. **Joe Burrow** got a text — and it was an injury report. Again. And the Cowboys continue to be the most dramatic villa contestants in football history. *And just like that, the season ends in shame.*",
      },
      players: [
        { id: 'patrick-mahomes', name: 'Patrick Mahomes', team: 'kc', league: 'nfl', number: 15 },
        { id: 'josh-allen', name: 'Josh Allen', team: 'buf', league: 'nfl', number: 17 },
        { id: 'joe-burrow', name: 'Joe Burrow', team: 'cin', league: 'nfl', number: 9 },
        { id: 'travis-kelce', name: 'Travis Kelce', team: 'kc', league: 'nfl', number: 87 },
      ],
      lesson: {
        title: 'The trade deadline is Casa Amor.',
        body:
          "I got a text! The trade deadline in the NFL (early November) is the moment where the producers (front offices) bring in fresh bombshells and break up perfectly fine couples (rosters).\n\nA 'buyer' team is in the original villa — they think they have a championship roster and want to add veterans. A 'seller' team is being shipped off to Casa Amor — they're swapping veterans for draft picks because this season is over.\n\nThe biggest deadline moves usually don't pay off. The villa chemistry gets disrupted. New bombshells take time to fit in. By February, half of them are dumped from the island. It's a recoupling. Tonight in this villa: chaos.",
      },
    },
  },

  // ─────────── THE BEAR — NFL ───────────
  {
    lens: 'the-bear',
    league: 'nfl',
    card: {
      drama: {
        prompt: 'What is going on in the NFL?',
        response:
          "Yes, chef. **Mahomes** is running the line for the Chiefs, going for the three-peat — a kitchen with three Michelin stars trying for a fourth. **Bill Belichick** is at North Carolina now, basically opening a fast-casual concept after years of running fine dining. And **Caleb Williams** in Chicago is Carmy in the family kitchen — inheriting the franchise from his predecessor's failures, trying to make it Michelin again. Cousin, what are we doing here. Every second counts.",
      },
      players: [
        { id: 'patrick-mahomes', name: 'Patrick Mahomes', team: 'kc', league: 'nfl', number: 15 },
        { id: 'caleb-williams', name: 'Caleb Williams', team: 'chi', league: 'nfl', number: 18 },
        { id: 'jalen-hurts', name: 'Jalen Hurts', team: 'phi', league: 'nfl', number: 1 },
        { id: 'lamar-jackson', name: 'Lamar Jackson', team: 'bal', league: 'nfl', number: 8 },
      ],
      lesson: {
        title: 'The salary cap, kitchen-style.',
        body:
          "The salary cap is the food cost the kitchen (front office) is allowed to run before management starts cutting menu items. In 2025, every NFL team has roughly $255M to spend on its 53-player roster.\n\nGo over and you can't sign anyone — your line cooks (depth players) sit at the back, your sous chefs (stars) demand more, and the chef (head coach) has to call audibles every shift. It's family meal at 5 with not enough food.\n\nThe smartest GMs (yes, chef) structure their cap like a tasting menu — small spend on rookies (who are locked into cheap rookie-scale deals), big spend on a couple of star ingredients, and let the Faks figure out the rest. Let it rip.",
      },
    },
  },
];

/**
 * Pick the best fallback Tea card for a given lens + league.
 * Falls back through: exact (lens, league) → exact lens with 'both' → 'plain' for that league → 'plain' for both.
 */
export function pickFallbackTea(lens: string, league: 'nfl' | 'nba' | 'both'): TeaCard {
  const exact = TEA_FALLBACK.find((t) => t.lens === lens && t.league === league);
  if (exact) return exact.card;

  const lensBoth = TEA_FALLBACK.find((t) => t.lens === lens && t.league === 'both');
  if (lensBoth) return lensBoth.card;

  const lensAny = TEA_FALLBACK.find((t) => t.lens === lens);
  if (lensAny) return lensAny.card;

  const plainLeague = TEA_FALLBACK.find((t) => t.lens === 'plain' && t.league === league);
  if (plainLeague) return plainLeague.card;

  return TEA_FALLBACK[0].card; // plain + both
}
