/**
 * Player → social handles lookup.
 *
 * Just IG for now — keeps the scan result legally clean (no hosting, no copyright,
 * no right-of-publicity issues — we just link out). Add Twitter/X, TikTok, etc.
 * to this file later as needed.
 *
 * Handles are username only (without the @). Construct the URL via instagramUrl().
 *
 * Last verified: 2026-04-29.
 */

export type PlayerSocial = {
  /** Instagram username (no @ prefix) */
  instagram?: string;
  /** Twitter / X username (no @ prefix) */
  twitter?: string;
};

/** Map of slug-id → social handles. Slug = lowercase-hyphenated full name. */
export const PLAYER_SOCIAL: Record<string, PlayerSocial> = {
  // ── NFL ──
  'patrick-mahomes': { instagram: 'patrickmahomes', twitter: 'PatrickMahomes' },
  'travis-kelce': { instagram: 'killatrav', twitter: 'tkelce' },
  'josh-allen': { instagram: 'joshallenqb', twitter: 'JoshAllenQB' },
  'joe-burrow': { instagram: 'joeyb_9', twitter: 'JoeyB' },
  'lamar-jackson': { instagram: 'newera8', twitter: 'Lj_era8' },
  'justin-jefferson': { instagram: 'jjettas2', twitter: 'JJettas2' },
  'saquon-barkley': { instagram: 'saquon', twitter: 'saquon' },
  'tyreek-hill': { instagram: 'cheetah', twitter: 'cheetah' },
  'caleb-williams': { instagram: 'calebcwilliams', twitter: 'CALEBcsw' },
  'cj-stroud': { instagram: 'cj7stroud', twitter: 'CJ7STROUD' },
  'tua-tagovailoa': { instagram: 'tuamoa', twitter: 'Tua' },
  'jalen-hurts': { instagram: 'jalenhurts', twitter: 'JalenHurts' },
  // round 2
  'bill-belichick': { instagram: 'billbelichick', twitter: 'BillBelichick' },
  'aaron-rodgers': { instagram: 'aaronrodgers12' },
  'trevor-lawrence': { instagram: 'trevorlawrencee', twitter: 'Trevorlawrencee' },
  'jerry-jones': { instagram: 'dallascowboys' },
  'justin-herbert': { instagram: 'justinherbert10' },
  'bo-nix': { instagram: 'bonix10', twitter: 'BoNix10' },
  'jayden-daniels': { instagram: 'jayd__5', twitter: 'JayD__5' },
  'russell-wilson': { instagram: 'dangerusswilson', twitter: 'DangeRussWilson' },
  'aidan-hutchinson': { instagram: 'aidanhutch97', twitter: 'aidanhutch97' },
  'drake-maye': { instagram: 'drakemaye2', twitter: 'drakemaye2' },
  // round 3 — skill positions
  'brock-purdy': { instagram: 'brockpurdy13', twitter: 'brockpurdy13' },
  'christian-mccaffrey': { instagram: 'christianmccaffrey', twitter: 'CMC_22' },
  'deebo-samuel': { instagram: 'deebosamuel19', twitter: '19problemz' },
  'george-kittle': { instagram: 'gkittle46', twitter: 'gkittle46' },
  'davante-adams': { instagram: 'tae', twitter: 'tae15adams' },
  'stefon-diggs': { instagram: 'stefondiggs', twitter: 'stefondiggs' },
  'cooper-kupp': { instagram: 'cooperkupp', twitter: 'CooperKupp' },
  'puka-nacua': { instagram: 'pukanacua', twitter: 'pukanacua' },
  'jamarr-chase': { instagram: 'real10jayy__', twitter: 'Real10jayy__' },
  'ceedee-lamb': { instagram: '_ceedeethree', twitter: '_CeeDeeThree' },
  'dak-prescott': { instagram: 'dak', twitter: 'dak' },
  'brock-bowers': { instagram: 'brockbowers9', twitter: 'BrockBowers9' },
  'marvin-harrison-jr': { instagram: 'marvharrisonjr', twitter: 'MarvHarrisonJr' },
  'malik-nabers': { instagram: 'maliknabers', twitter: 'MalikNabers' },
  'derrick-henry': { instagram: 'kingbennyhenry', twitter: 'KingHenry_2' },
  // round 3 — defense + dual stars
  'micah-parsons': { instagram: 'micahhparsons11', twitter: 'MicahhParsons11' },
  'myles-garrett': { instagram: 'flash_garrett', twitter: 'MylesLGarrett' },
  'sauce-gardner': { instagram: 'iamsauceg', twitter: 'iamSauceGardner' },
  'maxx-crosby': { instagram: 'crosby98_', twitter: 'CrosbyMaxx' },
  'christian-wilkins': { instagram: 'bigchristian94', twitter: 'BigChristian94' },
  'cj-gardner-johnson': { instagram: 'thececj23' },
  'pat-mcafee': { instagram: 'patmcafeeshow', twitter: 'PatMcAfeeShow' },

  // ── NBA ──
  'lebron-james': { instagram: 'kingjames', twitter: 'KingJames' },
  'stephen-curry': { instagram: 'stephencurry30', twitter: 'StephenCurry30' },
  'kevin-durant': { instagram: 'easymoneysniper', twitter: 'KDTrey5' },
  'victor-wembanyama': { instagram: 'wemby', twitter: 'wemby' },
  'shai-gilgeous-alexander': { instagram: 'shai', twitter: 'shaigilgeous' },
  'devin-booker': { instagram: 'dbook', twitter: 'DevinBook' },
  'anthony-edwards': { instagram: 'theanthonyedwards_', twitter: 'theantedwards_' },
  'luka-doncic': { instagram: 'luka7doncic', twitter: 'luka7doncic' },
  'jayson-tatum': { instagram: 'jaytatum0', twitter: 'jaytatum0' },
  'joel-embiid': { instagram: 'joelembiid', twitter: 'JoelEmbiid' },
  'bronny-james': { instagram: 'bronny', twitter: 'BronnyJames' },
  // (Jokic famously doesn't do social media — intentionally omitted)
  // round 2 NBA
  'ja-morant': { instagram: 'jamorant', twitter: 'JaMorant' },
  'kyrie-irving': { instagram: 'kyrieirving', twitter: 'KyrieIrving' },
  'tyrese-haliburton': { instagram: 'tyresehaliburton', twitter: 'TyHaliburton22' },
  'jalen-brunson': { instagram: 'jalenbrunson1', twitter: 'jalenbrunson1' },
  'jamal-murray': { instagram: 'beemglobal', twitter: 'BeMore27' },
  'klay-thompson': { instagram: 'klaythompson', twitter: 'KlayThompson' },
  'damian-lillard': { instagram: 'damianlillard', twitter: 'Dame_Lillard' },
  'donovan-mitchell': { instagram: 'spidadmitchell', twitter: 'spidadmitchell' },
  'lamelo-ball': { instagram: 'melo', twitter: 'MELOD1P' },
  'anthony-davis': { instagram: 'antdavis23', twitter: 'AntDavis23' },
  // round 3 NBA
  'jimmy-butler': { instagram: 'jimmybutler', twitter: 'JimmyButler' },
  'kawhi-leonard': { instagram: 'kawhileonard' },
  'trae-young': { instagram: 'traeyoung', twitter: 'TheTraeYoung' },
  'tyler-herro': { instagram: 'tylerherro', twitter: 'raf_tyler' },
  'bam-adebayo': { instagram: 'bam1of1', twitter: 'Bam1of1' },
  'karl-anthony-towns': { instagram: 'karltowns', twitter: 'KarlTowns' },
  'russell-westbrook': { instagram: 'russwest44', twitter: 'russwest44' },
  'draymond-green': { instagram: 'money23green', twitter: 'Money23Green' },
  'zion-williamson': { instagram: 'zionwilliamson', twitter: 'Zionwilliamson' },
  'scottie-barnes': { instagram: 'scottiebarnes', twitter: 'Scottiebarnes' },
  'chet-holmgren': { instagram: 'chetholmgren', twitter: 'ChetHolmgren' },
  'deaaron-fox': { instagram: 'swipathefox', twitter: 'swipathefox' },
  'zach-lavine': { instagram: 'zachlavine', twitter: 'ZachLaVine' },
  'bradley-beal': { instagram: 'bradbeal3', twitter: 'RealDealBeal23' },
  'pascal-siakam': { instagram: 'pskills43', twitter: 'pskills43' },
  'domantas-sabonis': { instagram: 'dsabonis11', twitter: 'Dsabonis11' },
  'alperen-sengun': { instagram: 'alpsengun', twitter: 'AlperenSengun' },
  'austin-reaves': { instagram: 'austinreaves15', twitter: 'austinreaves15' },
  'cooper-flagg': { instagram: 'cooperflagg', twitter: 'CooperFlagg' },
  'reed-sheppard': { instagram: 'reedsheppard', twitter: 'ReedSheppard' },
  'stephon-castle': { instagram: 'stephoncastle', twitter: 'StephonCastle' },
};

/** Convert a player display name to a slug ID. e.g. "Devin Booker" → "devin-booker" */
export function playerNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Look up social handles by player display name. */
export function getSocial(playerName: string): PlayerSocial | null {
  if (!playerName || playerName === 'Unknown') return null;
  const slug = playerNameToSlug(playerName);
  return PLAYER_SOCIAL[slug] ?? null;
}

export function instagramUrl(handle: string): string {
  return `https://instagram.com/${handle}`;
}

export function twitterUrl(handle: string): string {
  return `https://x.com/${handle}`;
}
