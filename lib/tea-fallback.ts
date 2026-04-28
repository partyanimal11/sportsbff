/**
 * Evergreen Tea fallback pack.
 *
 * Used when /api/today fails, rate-limits, or runs without an OpenAI key.
 * 4 hand-authored 3-card packs covering NFL + NBA + both, in plain or
 * Euphoria voice. We pick the closest match by (lens, league) — falling back
 * to a "plain" pack as the last resort.
 *
 * Other show lenses retired — Euphoria is the one prestige-TV lens.
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
