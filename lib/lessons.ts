/**
 * Lessons — typed data, hand-authored.
 *
 * Each lesson is a structured doc the lesson page renders. We don't use raw
 * MDX/markdown (yet) because typed sections give better control over visual
 * rhythm and lets the chat-breakout component drop in cleanly.
 */

export type LessonSection =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'callout'; title: string; body: string }
  | { type: 'keyterm'; term: string; def: string }
  | { type: 'pullquote'; text: string }
  | { type: 'chat-prompt'; prompts: string[] };

export type Lesson = {
  slug: string;
  league: 'nfl' | 'nba';
  title: string;
  subtitle: string;
  minutes: number;
  difficulty: 'Brand new' | 'Beginner' | 'Intermediate';
  intro: string;
  sections: LessonSection[];
};

export const LESSONS: Lesson[] = [
  {
    slug: 'nfl/01-the-rules',
    league: 'nfl',
    title: 'The rules, in 5 minutes',
    subtitle: 'Everything you need to follow a football game tonight.',
    minutes: 5,
    difficulty: 'Brand new',
    intro:
      "American football looks chaotic but it's actually a board game with very strict rules. By the end of this lesson you'll be able to follow the score, the clock, and 90% of what's happening on the field.",
    sections: [
      { type: 'h2', text: 'The point of the game' },
      {
        type: 'p',
        text: 'Two teams. One ball. The team with the ball is the offense. They want to move the ball into the other team\'s end zone (the painted area at each end of the field) — that\'s a touchdown. The team without the ball is the defense. They want to stop the offense.',
      },
      {
        type: 'p',
        text: 'You play four 15-minute quarters. The team with more points at the end wins.',
      },
      { type: 'h2', text: 'Downs (this is the only confusing part)' },
      {
        type: 'p',
        text: "The offense gets four tries to move the ball 10 yards forward. Each try is called a 'down'. If they get 10 yards, they get a fresh four tries. If they don't, they have to give the ball to the other team.",
      },
      {
        type: 'callout',
        title: 'Why you keep hearing "3rd and 7"',
        body: "It's the down number plus how many yards they still need. '3rd and 7' = third try, 7 yards still to go. If they don't make it on this play, they almost always punt (kick the ball away to the other team) on 4th down, because failing on 4th gives the other team great field position.",
      },
      { type: 'h2', text: 'How you score points' },
      {
        type: 'list',
        items: [
          '**Touchdown — 6 points.** Get the ball into the other team\'s end zone (carry it in or catch it in there).',
          '**Extra point — 1 point.** A short kick after every touchdown. Almost always good.',
          '**2-point conversion — 2 points.** Skip the kick, run or pass the ball into the end zone again from 2 yards out. Riskier, used when you need to catch up.',
          '**Field goal — 3 points.** A long kick through the goal posts. Used when the offense gets close but stalls.',
          '**Safety — 2 points (rare).** The defense tackles the offense in their own end zone. Almost never happens.',
        ],
      },
      { type: 'h2', text: 'The clock (and why teams "run out the clock")' },
      {
        type: 'p',
        text: "Each quarter is 15 minutes of game time, but the clock stops constantly — when the ball goes out of bounds, after an incomplete pass, after a touchdown. A real NFL game takes about 3 hours.",
      },
      {
        type: 'p',
        text: "Late in the game, the team that's winning often tries to run plays that *don't* stop the clock — usually handoffs to the running back. This is called 'running out the clock'. It's deeply boring and a sign your team is winning.",
      },
      { type: 'h2', text: 'A few terms you\'ll hear constantly' },
      { type: 'keyterm', term: 'Quarterback (QB)', def: 'The guy who throws the ball. The most important player on the field. Also the one in the commercials.' },
      { type: 'keyterm', term: 'Wide receiver (WR)', def: 'The guy who runs downfield to catch the QB\'s passes.' },
      { type: 'keyterm', term: 'Running back (RB)', def: 'The guy the QB hands the ball to so he can run with it.' },
      { type: 'keyterm', term: 'Sack', def: "When a defender tackles the QB before he can throw. Costs the offense yards and ends the play. *(Spotted: a quarterback in the dirt.)*" },
      { type: 'keyterm', term: 'Interception', def: "When the defense catches a pass meant for the offense. Possession flips immediately. Devastating." },
      { type: 'keyterm', term: 'Fumble', def: "When the player carrying the ball drops it. Whoever picks it up first owns it." },
      { type: 'keyterm', term: 'First down', def: "When the offense gets the 10 yards they needed. Fresh set of four tries. Crowd cheers." },
      { type: 'keyterm', term: 'Penalty', def: "When a player breaks a rule. The referee throws a yellow flag. The team gets pushed back 5–15 yards depending on the offense." },
      { type: 'h2', text: 'You can stop here' },
      {
        type: 'p',
        text: "Seriously. With this much, you can follow a game tonight. The other 1,000 things people argue about — formations, coverages, situational football — those come naturally once you've watched a few.",
      },
      {
        type: 'pullquote',
        text: 'You don\'t need to know what a "Cover 2 zone" is. You need to know who has the ball and where it\'s going.',
      },
      { type: 'chat-prompt', prompts: [
        'What does it mean when a team goes "for it" on 4th down?',
        'What\'s the difference between a touchdown and a field goal?',
        "Why do they call it a 'snap'?",
      ]},
    ],
  },
  {
    slug: 'nba/01-the-rules',
    league: 'nba',
    title: 'The rules, in 5 minutes',
    subtitle: 'Everything you need to watch a basketball game tonight.',
    minutes: 5,
    difficulty: 'Brand new',
    intro:
      "Basketball is the easiest pro sport to understand: ball goes in hoop, you get points. But there's a layer of rules under that which decides who wins close games. This is the layer.",
    sections: [
      { type: 'h2', text: 'The point of the game' },
      {
        type: 'p',
        text: "Two teams of five. Each team tries to put the ball through the other team's hoop. Whoever has more points after four 12-minute quarters wins. NBA quarters take ~30 real-life minutes each, so a game is about 2.5 hours.",
      },
      { type: 'h2', text: 'How points work' },
      {
        type: 'list',
        items: [
          '**2 points** — any shot made from inside the three-point line.',
          '**3 points** — any shot made from outside the three-point line (the curved line about 24 feet from the hoop).',
          '**1 point** — a free throw. You get free throws when the other team fouls you while you\'re shooting.',
        ],
      },
      {
        type: 'callout',
        title: 'Why everyone shoots threes now',
        body: "It's basic math. A 3 is worth 50% more than a 2, but it\'s only ~10% harder to make at NBA distance. Teams figured this out around 2015. The 3-point shot now defines the modern NBA.",
      },
      { type: 'h2', text: 'The shot clock (this is the secret of basketball)' },
      {
        type: 'p',
        text: "The team with the ball has 24 seconds to shoot. If they don't get a shot off, the other team gets the ball. This is why basketball never feels slow — every possession is a 24-second timer.",
      },
      { type: 'h2', text: 'Fouls (and why they matter)' },
      {
        type: 'p',
        text: "A foul is illegal contact — pushing, grabbing, hitting. A regular foul costs you nothing except getting whistled. But two things compound:",
      },
      {
        type: 'list',
        items: [
          "**Personal fouls.** Each player gets 6 before they're disqualified for the rest of the game ('fouling out'). Star players play scared once they have 4.",
          "**Team fouls.** Each team gets 5 fouls per quarter for free. After that, every additional foul = the other team shoots free throws. This is called being 'in the bonus' or 'in the penalty'.",
        ],
      },
      { type: 'h2', text: 'The five positions' },
      { type: 'keyterm', term: 'Point guard (PG)', def: 'The player who runs the offense — usually the smallest, fastest player. Steve Nash, Stephen Curry. Modern PGs both shoot AND set up teammates.' },
      { type: 'keyterm', term: 'Shooting guard (SG)', def: "Usually the team's best perimeter scorer. James Harden. Shai Gilgeous-Alexander." },
      { type: 'keyterm', term: 'Small forward (SF)', def: "The most versatile position — defends multiple positions, scores in multiple ways. LeBron James, Jayson Tatum, Kawhi Leonard." },
      { type: 'keyterm', term: 'Power forward (PF)', def: "The 'big' who can also shoot. Kevin Durant, Anthony Davis." },
      { type: 'keyterm', term: 'Center (C)', def: 'The biggest player on the team. Guards the rim. Sets screens. Joel Embiid, Nikola Jokic.' },
      {
        type: 'callout',
        title: 'But really, positions are dead',
        body: "Modern NBA stars play 'positionless' basketball. Jokic is a 7-foot center who passes like a guard. LeBron has played all five. Don't let the labels fool you — watch the ball.",
      },
      { type: 'h2', text: 'A few more terms' },
      { type: 'keyterm', term: 'Pick-and-roll', def: "Most-used play in basketball. One player blocks the defender so the other can drive or shoot. We have a whole lesson on this — it's the engine of the modern NBA." },
      { type: 'keyterm', term: 'Triple-double', def: 'When one player hits 10+ in three categories (points, rebounds, assists usually). It\'s like getting an A in three classes in the same week.' },
      { type: 'keyterm', term: 'And-one', def: "When you score AND get fouled at the same time. You make the basket and get a free throw. Crowd loses it." },
      { type: 'keyterm', term: 'Iso', def: 'Short for isolation. Everyone clears out so one guy can try to score one-on-one. The most dramatic moment in the sport.' },
      {
        type: 'pullquote',
        text: 'Every NBA game is a 48-minute argument about who\'s the alpha tonight.',
      },
      { type: 'chat-prompt', prompts: [
        "Why do they say 'and-one' instead of 'and-a-free-throw'?",
        'What\'s the difference between an offensive and defensive rebound?',
        "What's a technical foul?",
      ]},
    ],
  },
  {
    slug: 'nfl/02-fantasy-101',
    league: 'nfl',
    title: 'Fantasy football, the absolute basics',
    subtitle: "How to join a league and not embarrass yourself.",
    minutes: 7,
    difficulty: 'Beginner',
    intro:
      "Fantasy football is a game you play with your friends across a real NFL season. You draft real players. They earn you points based on what they do in real games. It is THE fastest way to get into football. Your first season will hook you.",
    sections: [
      { type: 'h2', text: 'The setup' },
      {
        type: 'p',
        text: "You and 9-11 friends form a league. Before the NFL season starts (late August / early September), you all gather (or hop on Zoom) for a draft. You take turns picking real NFL players. The draft is the actual best part of the year.",
      },
      {
        type: 'p',
        text: "Each week, you pick which of your players will start. Their real-life stats earn you points. You're matched up against one league-mate per week. Whoever scores more points wins that week. The standings update.",
      },
      {
        type: 'p',
        text: "After 14-15 weeks, the top 4 or 6 teams make the playoffs. The winner of the league championship gets bragging rights and (in most leagues) a small cash pot.",
      },
      { type: 'h2', text: "The roster (most leagues use this format)" },
      {
        type: 'list',
        items: [
          '**1 QB** (quarterback)',
          '**2 RB** (running backs)',
          '**2 WR** (wide receivers)',
          '**1 TE** (tight end)',
          '**1 FLEX** (one extra RB, WR, or TE)',
          '**1 K** (kicker)',
          '**1 DST** (a team\'s entire defense + special teams as one unit)',
          '**6-7 BENCH** spots (extra players you can swap in week-to-week)',
        ],
      },
      { type: 'h2', text: 'How players score points (a typical scoring system)' },
      {
        type: 'list',
        items: [
          '**Passing TD** = 4 points. **Passing yards** = 1 point per 25 yards.',
          '**Rushing/Receiving TD** = 6 points. **Rushing/Receiving yards** = 1 point per 10 yards.',
          '**Reception (PPR leagues)** = 1 point per catch. (PPR = Point Per Reception. The most common scoring style now.)',
          '**Interceptions / fumbles lost** = -2 points (for QBs and RBs).',
          '**Field goals** = 3-5 points each, depending on distance.',
        ],
      },
      {
        type: 'callout',
        title: 'Two scoring details that matter',
        body: "If your league is **PPR**, draft pass-catching backs and receivers higher (they get a point per catch). If it's **standard**, prioritize TD scorers. Always ask the commissioner before the draft. \n\nDecimal scoring (1 point per 10 yards = 8.3 points for 83 yards) is now standard. Old-school whole-number scoring is rare.",
      },
      { type: 'h2', text: "The draft (the most important day of your fantasy life)" },
      {
        type: 'p',
        text: "Each manager gets a slot in the draft order (random or chosen). Drafting goes 'snake' — round 1 goes 1 to 12, round 2 goes 12 back to 1, round 3 goes 1 to 12 again, and so on. This means whoever drafts last in round 1 gets to draft FIRST in round 2.",
      },
      {
        type: 'p',
        text: "You'll spend about 90 seconds per pick. The draft has 15-16 rounds. Have notes ready — a list of your top 100 players printed out, or a draft kit from any fantasy site.",
      },
      { type: 'h2', text: "What to do during the season" },
      {
        type: 'list',
        items: [
          "**Set your lineup before kickoff every Thursday/Sunday.** Forget once and you'll lose by default.",
          "**Watch the waiver wire.** Every Tuesday, undrafted players become available. The smart manager picks up emerging stars before others do.",
          "**Trade with caution.** Every league has That Guy who tries to fleece newbies. Run any trade by someone you trust.",
          "**Don't cry over injuries.** Star players get hurt. It's part of the game. Have a backup plan from week one.",
        ],
      },
      {
        type: 'pullquote',
        text: "Fantasy is the easiest way to fall in love with football, because suddenly you care about a guy on the Jaguars you'd never heard of.",
      },
      { type: 'chat-prompt', prompts: [
        'How do I prep for my first draft?',
        'What\'s a sleeper pick?',
        "What's the difference between PPR and standard scoring?",
      ]},
    ],
  },
  {
    slug: 'nfl/03-positions',
    league: 'nfl',
    title: 'Every position, in human English',
    subtitle: 'A roster has 53 names. You only need to learn nine.',
    minutes: 7,
    difficulty: 'Brand new',
    intro:
      "Football has 22 players on the field at once — 11 offense, 11 defense. The TV broadcast assumes you know who they all are. You don't have to. These nine archetypes cover 90% of what matters.",
    sections: [
      { type: 'h2', text: "Offense — the side that has the ball" },
      { type: 'keyterm', term: 'Quarterback (QB)', def: "The QB takes the snap (the ball from between the center's legs) and decides what to do — hand it off, throw it, or run. Everyone watches the QB. Everyone blames the QB. Mahomes, Allen, Burrow, Hurts." },
      { type: 'keyterm', term: 'Running back (RB)', def: "The QB hands him the ball, he runs forward, defenders try to tackle him. RBs also catch short passes. Saquon Barkley, Christian McCaffrey, Bijan Robinson." },
      { type: 'keyterm', term: 'Wide receiver (WR)', def: "Runs downfield to catch the QB's passes. The most glamorous skill position. Justin Jefferson, Tyreek Hill, Ja'Marr Chase, CeeDee Lamb." },
      { type: 'keyterm', term: 'Tight end (TE)', def: "Hybrid — bigger than a WR, blocks like a lineman, but also catches passes. Travis Kelce is the best ever to play it. Sam LaPorta is the best of the new wave." },
      { type: 'keyterm', term: 'Offensive line (OL)', def: "Five massive guys (300+ lbs each) who block defenders. You almost never notice them — until they screw up and the QB gets sacked. The center, two guards, two tackles." },
      { type: 'h2', text: 'Defense — the side trying to stop them' },
      { type: 'keyterm', term: 'Defensive line (DL)', def: 'Four big guys whose only job is to break through the offensive line and tackle the QB or RB. Maxx Crosby, Myles Garrett, Aidan Hutchinson — modern superstars.' },
      { type: 'keyterm', term: 'Linebackers (LB)', def: "Linebackers stand a few yards behind the defensive line. They tackle running backs, cover tight ends, and sometimes blitz the QB. Roquan Smith, Fred Warner." },
      { type: 'keyterm', term: 'Cornerback (CB)', def: "Speed kings who cover wide receivers one-on-one. Sauce Gardner, Pat Surtain II. The single hardest job on a football field." },
      { type: 'keyterm', term: 'Safety (S)', def: "The deepest defenders on the field. They roam in coverage and bail out everyone else. Kyle Hamilton, Brian Branch." },
      { type: 'h2', text: 'Special teams (the third unit you forget about)' },
      {
        type: 'p',
        text: "There's also a third unit that comes on the field for kicks and punts — kickers, punters, returners. Mostly invisible until the kicker misses a 42-yarder and loses your team the game.",
      },
      {
        type: 'callout',
        title: 'Two things to watch for',
        body: "**The QB-WR connection.** Most great offenses are built on one elite QB-WR pairing. Mahomes-Kelce. Burrow-Chase. Allen-Diggs (RIP).\n\n**The pass rush vs. the offensive line.** This is the chess match within every play. If the defensive line wins, the QB goes down. If the OL wins, the QB has time to find an open receiver. The whole game pivots on this.",
      },
      {
        type: 'pullquote',
        text: 'Once you can name nine positions, you can watch any NFL broadcast and know who the camera is on.',
      },
      { type: 'chat-prompt', prompts: [
        'What\'s a slot receiver?',
        'Why do they call it a "tight end"?',
        "What's the difference between a 4-3 and 3-4 defense?",
      ]},
    ],
  },
  {
    slug: 'nba/02-pick-and-roll',
    league: 'nba',
    title: 'The pick-and-roll, fully explained',
    subtitle: "The most-run play in basketball. Once you see it, you can't unsee it.",
    minutes: 6,
    difficulty: 'Beginner',
    intro:
      "If you only learn one basketball play, learn this one. Every NBA offense runs the pick-and-roll. By the end of this lesson you'll spot it 30 times a game.",
    sections: [
      { type: 'h2', text: 'The setup' },
      {
        type: 'p',
        text: "Two offensive players are involved. **Player A** has the ball. **Player B** is a teammate, usually a bigger player (a center or power forward). Player A's defender is in the way of where Player A wants to go.",
      },
      { type: 'h2', text: 'What happens (in three beats)' },
      {
        type: 'list',
        items: [
          "**1. The pick (or 'screen').** Player B walks over and stops in the path of Player A's defender. Like setting up a moving roadblock. Player B can't move now — that would be a foul (a 'moving screen').",
          "**2. The roll.** Player A drives past, using Player B as a wall. Player B then 'rolls' — pivots and runs toward the basket, ready to receive a pass.",
          "**3. The decision.** Player A now has options: shoot the open jumper, pass to the rolling Player B for a layup or dunk, or kick it out to a teammate the defense forgot about.",
        ],
      },
      {
        type: 'callout',
        title: "Why it's unstoppable",
        body: "The pick-and-roll forces defenses into a no-win choice. If both defenders chase Player A, Player B is wide open. If both defenders stay with Player B, Player A has a clean shot. If they 'switch' (Player B's defender takes Player A and vice versa), now you have a slow big trying to guard a quick guard, and a quick guard trying to box out a 7-footer. None of it works.\n\nNikola Jokic + Jamal Murray is the modern grand-master version.",
      },
      { type: 'h2', text: "What you'll hear announcers say" },
      { type: 'keyterm', term: '"They\'re running it again"', def: 'Translation: same pick-and-roll for the third possession in a row. The defense has not figured out how to stop it.' },
      { type: 'keyterm', term: '"He\'s switching onto the big"', def: 'Translation: a small defender ended up guarding a huge player after a screen. Bad outcome for the defense — usually leads to a basket.' },
      { type: 'keyterm', term: '"That\'s the pop, not the roll"', def: 'Translation: instead of rolling to the basket, Player B stepped back to the three-point line for a shot. Same play, different finish.' },
      { type: 'keyterm', term: '"Drop coverage"', def: "Translation: Player B's defender is hanging back near the basket instead of stepping out to defend Player A. This invites the jumper but protects the rim. The Jokic / Joker / drop debate is the most-discussed defensive scheme in the league." },
      {
        type: 'pullquote',
        text: "Steve Nash made a 17-year Hall of Fame career out of this one play. It's not a gimmick. It's the engine.",
      },
      { type: 'chat-prompt', prompts: [
        "What's a pick-and-pop?",
        'Why do they say "switch"?',
        "What's an illegal screen?",
      ]},
    ],
  },
];

export const LESSONS_BY_SLUG = new Map(LESSONS.map((l) => [l.slug, l]));

export function getLesson(slug: string): Lesson | undefined {
  return LESSONS_BY_SLUG.get(slug);
}

export function listLessonsForLibrary(): Array<Pick<Lesson, 'slug' | 'league' | 'title' | 'minutes' | 'difficulty' | 'subtitle'>> {
  return LESSONS.map(({ slug, league, title, minutes, difficulty, subtitle }) => ({
    slug, league, title, minutes, difficulty, subtitle,
  }));
}
