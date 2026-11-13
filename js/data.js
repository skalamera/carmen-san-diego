/* Meridian Bureau: world data.
   Every character, organisation and stolen object here is fictional. The geography is real. */
(function (MB) {
  'use strict';

  /* ---------- What witnesses can notice about a thief ---------- */
  MB.TRAITS = [
    { key: 'scarf', label: 'Scarf', values: [
      { id: 'saffron', label: 'Saffron', say: 'a saffron scarf', color: '#e8a21c' },
      { id: 'teal', label: 'Teal', say: 'a teal scarf', color: '#1fa39a' },
      { id: 'plum', label: 'Plum', say: 'a plum-coloured scarf', color: '#8a3f7d' },
      { id: 'ivory', label: 'Ivory', say: 'an ivory scarf', color: '#efe8d2' }
    ] },
    { key: 'ride', label: 'Getaway', values: [
      { id: 'sidecar', label: 'Sidecar motorcycle', say: 'a motorcycle with a sidecar' },
      { id: 'seaplane', label: 'Seaplane', say: 'a little seaplane' },
      { id: 'airship', label: 'Airship', say: 'a patched-up airship' },
      { id: 'speedboat', label: 'Speedboat', say: 'a speedboat' }
    ] },
    { key: 'pet', label: 'Companion', values: [
      { id: 'ferret', label: 'Ferret', say: 'a ferret' },
      { id: 'macaw', label: 'Macaw', say: 'a scarlet macaw' },
      { id: 'tortoise', label: 'Tortoise', say: 'a tortoise' },
      { id: 'whippet', label: 'Whippet', say: 'a whippet' }
    ] },
    { key: 'snack', label: 'Snack', values: [
      { id: 'licorice', label: 'Salted licorice', say: 'salted licorice' },
      { id: 'pistachio', label: 'Pistachios', say: 'pistachios' },
      { id: 'ginger', label: 'Candied ginger', say: 'candied ginger' },
      { id: 'toffee', label: 'Toffee', say: 'toffee' }
    ] },
    { key: 'tune', label: 'Hums', values: [
      { id: 'opera', label: 'Opera arias', say: 'an opera aria' },
      { id: 'surf', label: 'Surf rock', say: 'a surf-rock riff' },
      { id: 'shanty', label: 'Sea shanties', say: 'a sea shanty' },
      { id: 'tango', label: 'Tango', say: 'a tango' }
    ] }
  ];

  /* ---------- The Magpie Ring ---------- */
  MB.SUSPECTS = [
    { id: 'wren', code: 'Wren', name: 'Odalys Finch',
      bio: 'Former trapeze flyer. Has never used a door when a skylight was available.',
      traits: { scarf: 'saffron', ride: 'seaplane', pet: 'ferret', snack: 'pistachio', tune: 'tango' } },
    { id: 'rook', code: 'Rook', name: 'Barnaby Quill',
      bio: 'Disgraced chess grandmaster. Plans every job eleven moves ahead.',
      traits: { scarf: 'teal', ride: 'airship', pet: 'tortoise', snack: 'toffee', tune: 'opera' } },
    { id: 'shrike', code: 'Shrike', name: 'Ines Calloway',
      bio: 'Rally driver turned locksmith. Treats speed limits as a suggestion.',
      traits: { scarf: 'plum', ride: 'sidecar', pet: 'whippet', snack: 'licorice', tune: 'surf' } },
    { id: 'heron', code: 'Heron', name: 'Leopold Strand',
      bio: 'Retired lighthouse keeper with an alarming collection of keys.',
      traits: { scarf: 'ivory', ride: 'speedboat', pet: 'macaw', snack: 'ginger', tune: 'shanty' } },
    { id: 'lark', code: 'Lark', name: 'Mirabel Oyelaran',
      bio: 'Opera understudy who finally found an audience: security guards.',
      traits: { scarf: 'saffron', ride: 'airship', pet: 'whippet', snack: 'ginger', tune: 'opera' } },
    { id: 'kestrel', code: 'Kestrel', name: 'Cassius Varga',
      bio: 'Cartographer. Draws maps of places that would rather stay hidden.',
      traits: { scarf: 'teal', ride: 'sidecar', pet: 'macaw', snack: 'pistachio', tune: 'shanty' } },
    { id: 'starling', code: 'Starling', name: 'Yuki Tanabe',
      bio: 'Clockmaker. Can stop any alarm and, on a good day, time itself.',
      traits: { scarf: 'plum', ride: 'seaplane', pet: 'tortoise', snack: 'ginger', tune: 'surf' } },
    { id: 'osprey', code: 'Osprey', name: 'Dmitri Orlov',
      bio: 'Ex-circus strongman. Once carried off a vault. The whole vault.',
      traits: { scarf: 'ivory', ride: 'sidecar', pet: 'ferret', snack: 'toffee', tune: 'tango' } },
    { id: 'nightjar', code: 'Nightjar', name: 'Priya Lockhart',
      bio: 'Forger whose fake masterpieces hang in four real museums.',
      traits: { scarf: 'teal', ride: 'speedboat', pet: 'ferret', snack: 'licorice', tune: 'opera' } },
    { id: 'jackdaw', code: 'Jackdaw', name: 'Tomasz Brandt',
      bio: 'Stage magician. The disappearing act is not an act.',
      traits: { scarf: 'plum', ride: 'speedboat', pet: 'tortoise', snack: 'pistachio', tune: 'tango' } }
  ];

  /* ---------- Ranks: longer trails and less slack as you rise ---------- */
  MB.RANKS = [
    { min: 0, title: 'Trainee Tracer', trail: 4, slack: 26 },
    { min: 1, title: 'Field Tracer', trail: 5, slack: 22 },
    { min: 3, title: 'Senior Tracer', trail: 6, slack: 18 },
    { min: 6, title: 'Inspector', trail: 7, slack: 14 },
    { min: 10, title: 'Chief Inspector', trail: 8, slack: 10 }
  ];

  /* ---------- Places to ask questions. Tier 0 is a quick word, tier 2 a long interview ---------- */
  MB.TIER_COST = [1, 2, 3];
  MB.PLACES = {
    hotel: { name: 'Grand Hotel', who: 'concierge', intro: [
      'The concierge checks the ledger, then checks the lobby for eavesdroppers.',
      'The concierge polishes a bell that is already spotless.' ] },
    cafe: { name: 'Corner Café', who: 'barista', intro: [
      'The barista does not look up from the espresso machine.',
      'The barista wipes the same cup for the third time.' ] },
    kiosk: { name: 'Newsstand', who: 'news vendor', intro: [
      'The news vendor folds a paper into your hand as if it were a secret.',
      'The news vendor taps a headline about the theft.' ] },
    market: { name: 'Street Market', who: 'stallkeeper', intro: [
      'The stallkeeper weighs out an answer along with a bag of figs.',
      'The stallkeeper waves you behind a curtain of hanging lanterns.' ] },
    station: { name: 'Central Station', who: 'ticket clerk', intro: [
      'The ticket clerk stamps something, then remembers you exist.',
      'The ticket clerk squints up at the departures board.' ] },
    bank: { name: 'Exchange Bureau', who: 'teller', intro: [
      'The teller counts a stack of notes twice before answering.',
      'The teller slides the grille open an inch.' ] },
    garage: { name: 'Hire Garage', who: 'mechanic', intro: [
      'The mechanic rolls out from under a chassis, wiping both hands.',
      'The mechanic points a wrench at an empty parking bay.' ] },
    harbor: { name: 'Harbour Office', who: 'dockmaster', intro: [
      'The dockmaster watches a gull steal a sandwich, then turns to you.',
      'The dockmaster keeps coiling rope while talking.' ] },
    library: { name: 'City Library', who: 'archivist', intro: [
      'The archivist finishes shelving before granting you a whisper.',
      'The archivist adjusts a pair of very small spectacles.' ] },
    museum: { name: 'Museum', who: 'night guard', intro: [
      "The night guard's torch beam drifts over an empty display case.",
      'The night guard is still rattled.' ] },
    embassy: { name: 'Consulate', who: 'attaché', intro: [
      'The attaché stirs a cup of tea with diplomatic slowness.',
      'The attaché closes a folder marked DO NOT DISCUSS, then discusses it.' ] }
  };

  /* ---------- What witnesses say. {v} is filled in from the city or suspect data ---------- */
  MB.LINES = {
    lead: [
      'Somebody like that came through, yes.',
      'I remember. Hard to forget that one.',
      'You are not the first to ask.',
      'In a hurry, that one.',
      'Oh, them.',
      ''
    ],
    money: [
      'They traded a fat envelope of cash for {v}.',
      'Wanted the best rate on {v}, and wanted it fast.',
      'Tipped me in {v}. Said they would be needing plenty more.'
    ],
    flag: [
      'They had a paper flag tucked in their hatband: {v}.',
      'They asked which country flies {v}. Then laughed, as if they already knew.',
      'A sticker on their suitcase showed {v}.'
    ],
    tongue: [
      'They were drilling phrases out of a {v} phrasebook.',
      'Asked if anyone here could teach them {v} in an afternoon.',
      'They took a telephone call and switched to {v}. Badly.'
    ],
    sight: [
      'They {v}.',
      'Strange one. They {v}.',
      'All I caught was that they {v}.'
    ],
    trait: {
      scarf: [
        'You could not miss {v}.',
        'Wore {v}, knotted twice.',
        'I remember {v}. Nothing else about the outfit, only that.'
      ],
      ride: [
        'Said a ride was waiting: {v}.',
        'Kept bragging about {v} parked somewhere nearby.',
        'Their luggage tag had a little drawing of {v}.'
      ],
      pet: [
        'And they were not alone. They had {v} with them.',
        'They brought {v} along. Better manners than its owner.',
        'Asked whether we allowed animals. They meant {v}.'
      ],
      snack: [
        'Left a trail of {v} behind them.',
        'Offered me some {v}. I said no.',
        'Never once stopped eating {v}.'
      ],
      tune: [
        'Kept humming {v}.',
        'Whistled {v} on the way out.',
        'Hummed {v} under their breath the whole time.'
      ]
    },
    deny: [
      'No. Nobody like that. And I notice everybody.',
      'Sorry, tracer. It has been a quiet week.',
      'You have come a long way for nothing, friend.',
      'Not here. Are you sure you have the right city?',
      'I would remember. I do not.'
    ],
    close: [
      'The {who} looks straight through you. “I was paid to see nothing. So I saw nothing.” On your way out you find a black-and-white feather tucked under your collar. They know you are here.',
      '“Leave it alone, tracer.” The {who} will not say more. Outside, every pigeon on the square takes off at once. Someone is running across the rooftops.',
      'Before the {who} can answer, the lights cut out. When they come back there is a note on the counter: SO CLOSE. It is signed with a feather.',
      'The {who} only glances at the ceiling. Above you, floorboards creak, and then go very quiet.'
    ]
  };

  /* ---------- The world ----------
     money/tongue/flag/sights are how witnesses describe the place a thief is heading.
     currency/languages/known are what the Atlas shows.
     art tells the scene painter what to draw. */
  MB.CITIES = [
    { id: 'tokyo', name: 'Tokyo', country: 'Japan', lat: 35.68, lon: 139.69, utc: 9,
      money: 'yen', moneyKey: 'yen', currency: 'Japanese yen',
      tongue: 'Japanese', langKey: 'japanese', languages: 'Japanese',
      flag: 'a white flag with a red disc in the middle',
      sights: [
        'asked which platform the bullet train to Mount Fuji leaves from',
        'wanted ringside seats at a sumo tournament',
        'hoped to land before the cherry blossoms fell' ],
      known: 'Mount Fuji on the horizon, bullet trains, sumo, cherry blossoms',
      blurb: 'The greater city is home to more people than any other urban area on Earth, and its trains still run to the second. On clear days Mount Fuji shows itself to the west.',
      loot: 'a 300-year-old clockwork tea-serving doll',
      art: { far: 0.5, lm: 'pagoda', back: 'fuji', style: 'modern', flora: 'blossom' } },

    { id: 'cairo', name: 'Cairo', country: 'Egypt', lat: 30.04, lon: 31.24, utc: 2,
      money: 'pounds', moneyKey: 'pound', currency: 'Egyptian pound',
      tongue: 'Arabic', langKey: 'arabic', languages: 'Arabic',
      flag: 'a flag of red, white and black bands with a golden eagle',
      sights: [
        'wanted a room with a view of the pyramids',
        'asked how far up the Nile the river boats run',
        'kept sketching a great stone sphinx' ],
      known: 'The pyramids of Giza, the Sphinx, the river Nile',
      blurb: "Africa's great river city sprawls along the Nile, with the pyramids of Giza standing at the edge of its suburbs. They were already ancient when Rome was founded.",
      loot: 'the gilded sandal of a forgotten pharaoh',
      art: { lm: 'pyramids', back: 'dunes', style: 'adobe', flora: 'palm', ground: '#d2a866', lx: 190 } },

    { id: 'paris', name: 'Paris', country: 'France', lat: 48.86, lon: 2.35, utc: 1,
      money: 'euros', moneyKey: 'euro', currency: 'Euro',
      tongue: 'French', langKey: 'french', languages: 'French',
      flag: 'a flag of three upright stripes: blue, white, red',
      sights: [
        'asked whether the lifts were running on a famous iron tower',
        'planned a slow boat down the Seine',
        'wanted to stand in front of the Mona Lisa' ],
      known: 'An iron lattice tower, the river Seine, the Louvre and the Mona Lisa',
      blurb: 'The French capital grew outward from an island in the Seine. Its iron tower was only meant to stand for twenty years. That was in 1889.',
      loot: 'the original blueprints of the great iron tower',
      art: { lm: 'lattice', style: 'old', water: 1, flora: 'round' } },

    { id: 'rio', name: 'Rio de Janeiro', country: 'Brazil', lat: -22.91, lon: -43.17, utc: -3,
      money: 'reais', moneyKey: 'real', currency: 'Brazilian real (plural: reais)',
      tongue: 'Portuguese', langKey: 'portuguese', languages: 'Portuguese',
      flag: 'a green flag with a yellow diamond and a starry blue globe',
      sights: [
        'asked about the cable car up Sugarloaf Mountain',
        'was sewing sequins onto a Carnival costume',
        'wanted to walk the sands of Copacabana' ],
      known: 'Sugarloaf Mountain, Carnival, Copacabana beach',
      blurb: 'Granite peaks rise straight out of the Atlantic here, and the city squeezes in between them and the beach. Brazilians speak Portuguese, not Spanish.',
      loot: 'the feathered crown of the Carnival queen',
      art: { far: 0.5, lm: 'sugarloaf', back: 'hills', style: 'modern', water: 1, flora: 'palm', lx: 232 } },

    { id: 'sydney', name: 'Sydney', country: 'Australia', lat: -33.87, lon: 151.21, utc: 10,
      money: 'dollars', moneyKey: 'dollar', currency: 'Australian dollar',
      tongue: 'English', langKey: 'english', languages: 'English',
      flag: 'a blue flag with a Union Jack and six white stars',
      sights: [
        'wanted a ticket to an opera house with a roof like sails',
        'asked where to see kangaroos near a great harbour bridge',
        'said the seasons would be upside down where they were going' ],
      known: 'An opera house with sail-shaped roofs, the Harbour Bridge, kangaroos',
      blurb: "Australia's largest city wraps around one of the world's great natural harbours. It is not the capital (that is Canberra), and January here is midsummer.",
      loot: 'the tuning fork for the opera house organ',
      art: { lm: 'opera', style: 'modern', water: 1, lx: 196 } },

    { id: 'nairobi', name: 'Nairobi', country: 'Kenya', lat: -1.29, lon: 36.82, utc: 3,
      money: 'shillings', moneyKey: 'shilling', currency: 'Kenyan shilling',
      tongue: 'Swahili', langKey: 'swahili', languages: 'Swahili, English',
      flag: "a black, red and green flag with a warrior's shield and two spears",
      sights: [
        'wanted to photograph giraffes with skyscrapers behind them',
        'asked about safaris on the very edge of a capital city',
        'said they would be a mile high and almost standing on the Equator' ],
      known: 'A national park beside the city, giraffes and lions, the Equator nearby',
      blurb: "Kenya's capital sits a mile high and barely south of the Equator. A national park with lions and giraffes begins where the suburbs end.",
      loot: 'the first map ever drawn of the Great Rift Valley',
      art: { lm: 'savanna', back: 'hills', style: 'modern', flora: 'acacia', ground: '#b89a58', lx: 222 } },

    { id: 'mumbai', name: 'Mumbai', country: 'India', lat: 19.08, lon: 72.88, utc: 5.5,
      money: 'rupees', moneyKey: 'rupee', currency: 'Indian rupee',
      tongue: 'Hindi', langKey: 'hindi', languages: 'Marathi, Hindi, English',
      flag: 'a saffron, white and green flag with a navy-blue wheel',
      sights: [
        'asked about a grand stone arch facing the Arabian Sea',
        'wanted a walk-on part in a Bollywood film',
        'worried about arriving in the middle of the monsoon' ],
      known: 'The Gateway of India arch, Bollywood film studios, the monsoon',
      blurb: "India's biggest city is built on what were once seven islands in the Arabian Sea. Its film studios turn out more movies a year than Hollywood.",
      loot: 'a film reel from the first Bollywood talkie',
      art: { lm: 'gate', style: 'mixed', water: 1, flora: 'palm' } },

    { id: 'beijing', name: 'Beijing', country: 'China', lat: 39.90, lon: 116.41, utc: 8,
      money: 'yuan', moneyKey: 'yuan', currency: 'Chinese yuan (renminbi)',
      tongue: 'Mandarin', langKey: 'mandarin', languages: 'Mandarin Chinese',
      flag: 'a red flag with one big yellow star and four small ones',
      sights: [
        'asked for directions to the Forbidden City',
        'wanted to walk a stretch of the Great Wall before lunch',
        "was reading up on an emperor's Temple of Heaven" ],
      known: 'The Forbidden City, the Great Wall in the hills nearby, the Temple of Heaven',
      blurb: "China's capital has been a seat of emperors for centuries, and the Forbidden City at its heart has some 9,000 rooms. The Great Wall runs through the hills to the north.",
      loot: 'a jade cricket cage from the Forbidden City',
      art: { lm: 'heaven', back: 'mountains', style: 'old', flora: 'round' } },

    { id: 'moscow', name: 'Moscow', country: 'Russia', lat: 55.76, lon: 37.62, utc: 3,
      money: 'rubles', moneyKey: 'ruble', currency: 'Russian ruble',
      tongue: 'Russian', langKey: 'russian', languages: 'Russian',
      flag: 'a flag of three level bands: white, blue, red',
      sights: [
        'asked about a cathedral with onion domes like striped sweets',
        'wanted to see metro stations that look like palaces',
        'mentioned a meeting on Red Square' ],
      known: "Onion-domed St Basil's Cathedral, Red Square, palatial metro stations",
      blurb: "Russia's capital is the largest city that lies entirely in Europe. Winter arrives early, and the deepest metro stations are decorated like ballrooms.",
      loot: 'a jewelled egg with a tiny golden train inside',
      art: { lm: 'onion', style: 'old', flora: 'conifer', ground: '#dfe6ee' } },

    { id: 'newyork', name: 'New York', country: 'United States', lat: 40.71, lon: -74.01, utc: -5,
      money: 'dollars', moneyKey: 'dollar', currency: 'US dollar',
      tongue: 'English', langKey: 'english', languages: 'English',
      flag: 'a flag with thirteen stripes and fifty stars',
      sights: [
        'asked about ferries to a green statue holding a torch',
        'wanted front-row seats on Broadway',
        'planned a picnic in Central Park' ],
      known: 'The Statue of Liberty, Broadway, Central Park',
      blurb: "Five boroughs, most of them on islands, at the mouth of the Hudson River. It is the biggest city in the United States, though it has not been the capital since 1790.",
      loot: "the lantern from the torch-keeper's cabin on Liberty Island",
      art: { lm: 'deco', style: 'modern', water: 1, lx: 208 } },

    { id: 'mexico', name: 'Mexico City', country: 'Mexico', lat: 19.43, lon: -99.13, utc: -6,
      money: 'pesos', moneyKey: 'peso', currency: 'Mexican peso',
      tongue: 'Spanish', langKey: 'spanish', languages: 'Spanish',
      flag: 'a green, white and red flag with an eagle perched on a cactus',
      sights: [
        'said the city was built on a drained lake, on top of Aztec ruins',
        'asked about the pyramids of the Sun and the Moon, a short drive away',
        'was warned the air gets thin, more than two thousand metres up' ],
      known: 'Aztec ruins under the streets, the pyramids of Teotihuacan, very high altitude',
      blurb: 'One of the largest cities in the Americas sits 2,240 metres up, on the bed of a lake the Aztecs once paddled across. Their capital, Tenochtitlan, lies beneath the streets.',
      loot: 'a turquoise mosaic serpent',
      art: { lm: 'steps', back: 'volcano', style: 'bright', flora: 'cactus', ground: '#9a8a66' } },

    { id: 'lima', name: 'Lima', country: 'Peru', lat: -12.05, lon: -77.04, utc: -5,
      money: 'soles', moneyKey: 'sol', currency: 'Peruvian sol',
      tongue: 'Spanish', langKey: 'spanish', languages: 'Spanish, Quechua',
      flag: 'a flag of three upright stripes: red, white, red',
      sights: [
        'asked how to get from a desert coast up to Machu Picchu',
        'wanted the best ceviche on the Pacific',
        'said it almost never rains where they were going, though it sits beside an ocean' ],
      known: 'The road to Machu Picchu and the Andes, ceviche, a desert coast on the Pacific',
      blurb: "Peru's capital is a desert city on a foggy Pacific coast, where it almost never rains. The Andes, and the old Inca roads, begin just inland.",
      loot: 'a golden llama figurine from the Inca empire',
      art: { lm: 'cathedral', back: 'mountains', style: 'bright', flora: 'palm', ground: '#a8946c' } },

    { id: 'buenosaires', name: 'Buenos Aires', country: 'Argentina', lat: -34.60, lon: -58.38, utc: -3,
      money: 'pesos', moneyKey: 'peso', currency: 'Argentine peso',
      tongue: 'Spanish', langKey: 'spanish', languages: 'Spanish',
      flag: 'a sky-blue and white flag with a golden sun',
      sights: [
        'was practising tango steps in the corridor',
        'asked about a white obelisk on one of the widest avenues in the world',
        'mentioned crossing the Río de la Plata' ],
      known: 'The tango, a white obelisk on a vast avenue, the Río de la Plata',
      blurb: "Argentina's capital faces the Río de la Plata, an estuary so wide you cannot see across it. The tango was born in its dockside neighbourhoods.",
      loot: 'the bandoneon that played the very first tango',
      art: { lm: 'obelisk', style: 'mixed', flora: 'jacaranda' } },

    { id: 'london', name: 'London', country: 'United Kingdom', lat: 51.51, lon: -0.13, utc: 0,
      money: 'pounds', moneyKey: 'pound', currency: 'Pound sterling',
      tongue: 'English', langKey: 'english', languages: 'English',
      flag: 'a flag of red and white crosses on dark blue',
      sights: [
        'asked what time a famous clock tower chimes beside the Thames',
        'wanted to stand on the prime meridian at Greenwich',
        'asked which bridge has two towers and lifts for ships' ],
      known: 'The clock tower of Big Ben, the river Thames, Tower Bridge, the prime meridian at Greenwich',
      blurb: "The Thames winds through Britain's capital, past a clock tower the world knows by the name of its bell. At Greenwich, to the east, the world's longitude starts at zero.",
      loot: 'the spare hands of the great clock at Westminster',
      art: { lm: 'clock', style: 'old', water: 1, lx: 150 } },

    { id: 'rome', name: 'Rome', country: 'Italy', lat: 41.90, lon: 12.50, utc: 1,
      money: 'euros', moneyKey: 'euro', currency: 'Euro',
      tongue: 'Italian', langKey: 'italian', languages: 'Italian',
      flag: 'a flag of three upright stripes: green, white, red',
      sights: [
        'wanted to toss a coin into the Trevi Fountain',
        'asked about gladiator tours at the Colosseum',
        "said they would visit the world's smallest country just by crossing a street" ],
      known: 'The Colosseum, the Trevi Fountain, Vatican City inside the city',
      blurb: "Built, they say, on seven hills beside the Tiber, Italy's capital has been lived in for nearly three thousand years. A whole separate country, Vatican City, fits inside it.",
      loot: "a gladiator's bronze helmet",
      art: { lm: 'colosseum', back: 'hills', style: 'old', flora: 'umbrella' } },

    { id: 'istanbul', name: 'Istanbul', country: 'Türkiye', lat: 41.01, lon: 28.98, utc: 3,
      money: 'lira', moneyKey: 'lira', currency: 'Turkish lira',
      tongue: 'Turkish', langKey: 'turkish', languages: 'Turkish',
      flag: 'a red flag with a white crescent moon and star',
      sights: [
        'wanted to cross from Europe to Asia by ferry without leaving the city',
        'asked for a map of the Grand Bazaar',
        'kept a postcard of a huge domed building called Hagia Sophia' ],
      known: 'The Bosphorus between Europe and Asia, Hagia Sophia, the Grand Bazaar',
      blurb: "The only great city to straddle two continents: Europe on one bank of the Bosphorus, Asia on the other. It has been Byzantium and Constantinople, but Türkiye's capital is Ankara.",
      loot: "a sultan's jewelled coffee set",
      art: { lm: 'mosque', back: 'hills', style: 'old', water: 1 } },

    { id: 'athens', name: 'Athens', country: 'Greece', lat: 37.98, lon: 23.73, utc: 2,
      money: 'euros', moneyKey: 'euro', currency: 'Euro',
      tongue: 'Greek', langKey: 'greek', languages: 'Greek',
      flag: 'a blue-and-white striped flag with a white cross in the corner',
      sights: [
        'wanted to climb the Acropolis before the midday heat',
        'asked where democracy was born',
        'was reading about the first modern Olympic Games' ],
      known: 'The Acropolis and the Parthenon, the birthplace of democracy, the first modern Olympics',
      blurb: "Greece's capital has been continuously lived in for over three thousand years. The marble temples on the Acropolis have watched over it for most of them.",
      loot: 'a marble owl from the Acropolis',
      art: { lm: 'parthenon', back: 'hills', style: 'white', flora: 'conifer' } },

    { id: 'reykjavik', name: 'Reykjavík', country: 'Iceland', lat: 64.15, lon: -21.94, utc: 0,
      money: 'krónur', moneyKey: 'krona', currency: 'Icelandic króna',
      tongue: 'Icelandic', langKey: 'icelandic', languages: 'Icelandic',
      flag: 'a blue flag with a red cross edged in white',
      sights: [
        'hoped to watch the northern lights from a hot spring',
        "asked about geysers and glaciers within a day's drive",
        "said they were headed for the world's most northerly capital" ],
      known: 'Northern lights, geysers and hot springs, glaciers and volcanoes',
      blurb: "The world's most northerly capital is heated by volcanic hot water piped up from underground. In midsummer the sun barely sets. In midwinter it barely rises.",
      loot: 'a thousand-year-old saga manuscript',
      art: { lm: 'church', back: 'snow', style: 'bright', water: 1, aurora: 1 } },

    { id: 'marrakech', name: 'Marrakech', country: 'Morocco', lat: 31.63, lon: -8.00, utc: 1,
      money: 'dirhams', moneyKey: 'dirham', currency: 'Moroccan dirham',
      tongue: 'Arabic', langKey: 'arabic', languages: 'Arabic, Amazigh (Berber)',
      flag: 'a red flag with a green five-pointed star',
      sights: [
        'asked about the storytellers in a square called Jemaa el-Fnaa',
        'wanted to ride up into the Atlas Mountains',
        'called it the Red City and asked where to buy saffron in the souks' ],
      known: 'Jemaa el-Fnaa square, the souks, the Atlas Mountains, rose-red walls',
      blurb: "Morocco's 'Red City' is ringed by rose-coloured walls, with the snowy Atlas Mountains on the horizon. Its main square turns into an open-air theatre every night.",
      loot: "a caravan master's silver astrolabe",
      art: { lm: 'minaret', back: 'snow', style: 'adobe', flora: 'palm', ground: '#c98f5e' } },

    { id: 'capetown', name: 'Cape Town', country: 'South Africa', lat: -33.92, lon: 18.42, utc: 2,
      money: 'rand', moneyKey: 'rand', currency: 'South African rand',
      tongue: 'Afrikaans', langKey: 'afrikaans', languages: 'Afrikaans, Xhosa, English',
      flag: 'a six-coloured flag with a green Y lying on its side',
      sights: [
        'asked about the cable car up a flat-topped mountain',
        'wanted to see penguins on an African beach',
        'planned to sail around the Cape of Good Hope' ],
      known: 'Table Mountain, penguins on the beach, the Cape of Good Hope',
      blurb: "Near the southern tip of Africa, this port sits beneath a flat-topped mountain often draped in a 'tablecloth' of cloud. South Africa has three capitals, and this is where parliament meets.",
      loot: 'the great lens from the Cape of Good Hope lighthouse',
      art: { far: 0.5, lm: 'lighthouse', back: 'mesa', style: 'mixed', water: 1, lx: 262 } },

    { id: 'bangkok', name: 'Bangkok', country: 'Thailand', lat: 13.76, lon: 100.50, utc: 7,
      money: 'baht', moneyKey: 'baht', currency: 'Thai baht',
      tongue: 'Thai', langKey: 'thai', languages: 'Thai',
      flag: 'a flag of five bands: red, white, a wide blue, white, red',
      sights: [
        'asked where to hire a tuk-tuk to the floating markets',
        'wanted to see a giant reclining Buddha covered in gold leaf',
        'mentioned river boats on the Chao Phraya' ],
      known: 'Golden temple spires, floating markets, tuk-tuks, the Chao Phraya river',
      blurb: "Thailand's capital is laced with canals off the Chao Phraya River and crowded with golden temple spires. Its full ceremonial name is the longest of any city on Earth.",
      loot: 'a miniature golden royal barge',
      art: { lm: 'prang', style: 'mixed', water: 1, flora: 'palm' } },

    { id: 'singapore', name: 'Singapore', country: 'Singapore', lat: 1.35, lon: 103.82, utc: 8,
      money: 'dollars', moneyKey: 'dollar', currency: 'Singapore dollar',
      tongue: 'Malay', langKey: 'malay', languages: 'English, Mandarin, Malay, Tamil',
      flag: 'a red-and-white flag with a crescent moon and five stars',
      sights: [
        'asked about an island city-state one degree north of the Equator',
        'wanted a photograph of a fountain that is half lion, half fish',
        "was curious about giant metal 'supertrees' in a garden by a bay" ],
      known: 'An island city-state near the Equator, the Merlion fountain, giant garden supertrees',
      blurb: 'A city, an island and a country all at once, one degree north of the Equator at the tip of the Malay Peninsula. It has four official languages.',
      loot: 'the rarest orchid in the Botanic Gardens',
      art: { lm: 'trio', style: 'modern', water: 1, flora: 'palm' } },

    { id: 'kathmandu', name: 'Kathmandu', country: 'Nepal', lat: 27.72, lon: 85.32, utc: 5.75,
      money: 'rupees', moneyKey: 'rupee', currency: 'Nepalese rupee',
      tongue: 'Nepali', langKey: 'nepali', languages: 'Nepali',
      flag: 'a flag made of two stacked crimson triangles, not a rectangle at all',
      sights: [
        'was pricing climbing gear for the Himalaya',
        'wanted to spin prayer wheels at a giant white stupa',
        'asked for a window seat with a view of Mount Everest' ],
      known: 'The Himalaya and Mount Everest, white stupas, prayer flags',
      blurb: "Nepal's capital lies in a valley 1,400 metres up, with the highest mountains on Earth to the north. Its clocks run an unusual five hours and forty-five minutes ahead of Greenwich.",
      loot: 'the summit logbook of an early Everest expedition',
      art: { lm: 'stupa', back: 'snow', style: 'old', ground: '#8a7a62' } },

    { id: 'havana', name: 'Havana', country: 'Cuba', lat: 23.11, lon: -82.37, utc: -5,
      money: 'pesos', moneyKey: 'peso', currency: 'Cuban peso',
      tongue: 'Spanish', langKey: 'spanish', languages: 'Spanish',
      flag: 'a blue-and-white striped flag with a red triangle and a single white star',
      sights: [
        'wanted to ride a 1950s convertible along a sea wall called the Malecón',
        'asked about the largest island in the Caribbean',
        'asked where to hear a rumba band in the old town' ],
      known: 'Vintage 1950s cars, the Malecón sea wall, the largest island in the Caribbean',
      blurb: "Cuba's capital faces the Straits of Florida from behind a long sea wall. Its streets are a rolling museum of cars from the 1950s.",
      loot: "the chrome hood ornament from the city's oldest taxi",
      art: { lm: 'capitol', style: 'bright', water: 1, flora: 'palm' } },

    { id: 'toronto', name: 'Toronto', country: 'Canada', lat: 43.65, lon: -79.38, utc: -5,
      money: 'dollars', moneyKey: 'dollar', currency: 'Canadian dollar',
      tongue: 'English', langKey: 'english', languages: 'English (French is also official in Canada)',
      flag: 'a red-and-white flag with a maple leaf',
      sights: [
        'asked about a needle-thin tower beside Lake Ontario',
        'wanted a day trip to Niagara Falls',
        'was desperate to visit a hockey hall of fame' ],
      known: 'A needle-thin tower on Lake Ontario, Niagara Falls nearby, ice hockey',
      blurb: "Canada's largest city lines the north shore of Lake Ontario. It is not the capital (that is Ottawa), and nearly half the people who live here were born in another country.",
      loot: 'a century-old silver hockey trophy',
      art: { lm: 'needle', style: 'modern', water: 1 } },

    { id: 'amsterdam', name: 'Amsterdam', country: 'Netherlands', lat: 52.37, lon: 4.90, utc: 1,
      money: 'euros', moneyKey: 'euro', currency: 'Euro',
      tongue: 'Dutch', langKey: 'dutch', languages: 'Dutch',
      flag: 'a flag of three level bands: red, white, blue',
      sights: [
        'wanted to rent a bicycle and ride along the canals',
        'asked when the tulip fields bloom',
        'said half the place sits below sea level, behind dikes' ],
      known: 'Canals, bicycles, tulips, windmills, land below sea level',
      blurb: 'The Dutch capital is built on millions of wooden piles driven into soggy ground, and threaded with more than a hundred kilometres of canals. There are more bicycles here than people.',
      loot: 'a tulip bulb once worth more than a canal house',
      art: { lm: 'windmill', style: 'gable', water: 1, lx: 236 } },

    { id: 'stockholm', name: 'Stockholm', country: 'Sweden', lat: 59.33, lon: 18.07, utc: 1,
      money: 'kronor', moneyKey: 'krona', currency: 'Swedish krona',
      tongue: 'Swedish', langKey: 'swedish', languages: 'Swedish',
      flag: 'a blue flag with a yellow cross',
      sights: [
        'said the city is spread across fourteen islands',
        'asked where the Nobel Prizes are handed out',
        'wanted to see a warship that sank on its first voyage in 1628' ],
      known: 'A city on fourteen islands, the Nobel Prizes, the salvaged warship Vasa',
      blurb: "Sweden's capital is scattered across fourteen islands where a great lake meets the Baltic Sea. Every December, most of the Nobel Prizes are presented here.",
      loot: 'a bronze cannon from a sunken warship',
      art: { lm: 'spires', style: 'bright', water: 1, flora: 'conifer', lx: 150 } },

    { id: 'seoul', name: 'Seoul', country: 'South Korea', lat: 37.57, lon: 126.98, utc: 9,
      money: 'won', moneyKey: 'won', currency: 'South Korean won',
      tongue: 'Korean', langKey: 'korean', languages: 'Korean',
      flag: 'a white flag with a red-and-blue circle and four sets of black bars',
      sights: [
        'asked about the changing of the guard at Gyeongbokgung Palace',
        'wanted to learn how to make kimchi',
        'mentioned a walk along the Han River' ],
      known: 'Gyeongbokgung Palace, kimchi, the Han River',
      blurb: "South Korea's capital is ringed by granite mountains and split by the broad Han River. Royal palaces five centuries old sit in the shadow of glass towers.",
      loot: 'a celadon crane vase from the Goryeo dynasty',
      art: { far: 0.6, lm: 'palace', back: 'mountains', style: 'modern', flora: 'blossom', lx: 170 } },

    { id: 'auckland', name: 'Auckland', country: 'New Zealand', lat: -36.85, lon: 174.76, utc: 12,
      money: 'dollars', moneyKey: 'dollar', currency: 'New Zealand dollar',
      tongue: 'Māori', langKey: 'maori', languages: 'English, Māori',
      flag: 'a blue flag with a Union Jack and four red stars',
      sights: [
        'called it the City of Sails',
        "asked how many of the city's fifty-odd volcanoes you can climb",
        'wanted to see a kiwi: the bird, not the fruit' ],
      known: 'The City of Sails, dozens of volcanic cones, kiwi birds',
      blurb: "New Zealand's biggest city sits on a narrow neck of land between two harbours, dotted with dozens of dormant volcanic cones. The capital, though, is Wellington.",
      loot: "a champion yacht's silver trophy",
      art: { far: 0.6, lm: 'needle', back: 'volcano', style: 'mixed', water: 1, boats: 5, lx: 120 } },

    { id: 'lagos', name: 'Lagos', country: 'Nigeria', lat: 6.52, lon: 3.38, utc: 1,
      money: 'naira', moneyKey: 'naira', currency: 'Nigerian naira',
      tongue: 'Yoruba', langKey: 'yoruba', languages: 'English (official), Yoruba',
      flag: 'a flag of three upright stripes: green, white, green',
      sights: [
        'wanted to visit a Nollywood film set',
        "asked about the biggest city in Africa's most populous country",
        'mentioned a very long bridge across a lagoon' ],
      known: "Nollywood films, a great lagoon, the largest city in Africa's most populous country",
      blurb: "Nigeria's largest city spreads across islands and a lagoon on the Gulf of Guinea. It is one of the fastest-growing cities in the world, though the capital is Abuja.",
      loot: 'the master tapes of a legendary Afrobeat session',
      art: { lm: 'cable', style: 'modern', water: 1, flora: 'palm', lx: 110 } },

    { id: 'addis', name: 'Addis Ababa', country: 'Ethiopia', lat: 9.03, lon: 38.74, utc: 3,
      money: 'birr', moneyKey: 'birr', currency: 'Ethiopian birr',
      tongue: 'Amharic', langKey: 'amharic', languages: 'Amharic',
      flag: 'a green, yellow and red flag with a star on a blue disc',
      sights: [
        'said they were headed where coffee was first discovered',
        'asked about a country whose calendar has thirteen months',
        'mentioned a highland capital that hosts the African Union' ],
      known: 'The birthplace of coffee, a thirteen-month calendar, the African Union headquarters',
      blurb: "Ethiopia's capital sits more than 2,300 metres up in the highlands and hosts the headquarters of the African Union. Ethiopia keeps its own calendar, with thirteen months.",
      loot: 'a clay coffee pot said to have brewed the very first cup',
      art: { far: 0.6, lm: 'obelisk', back: 'mountains', style: 'mixed', flora: 'conifer', ground: '#7f8a55', lx: 160 } },

    { id: 'hanoi', name: 'Hanoi', country: 'Vietnam', lat: 21.03, lon: 105.85, utc: 7,
      money: 'dong', moneyKey: 'dong', currency: 'Vietnamese dong',
      tongue: 'Vietnamese', langKey: 'vietnamese', languages: 'Vietnamese',
      flag: 'a red flag with a single yellow star',
      sights: [
        'wanted tickets to a water-puppet show',
        'asked about a cruise among the limestone islands of Ha Long Bay',
        'was hungry for a bowl of pho in the Old Quarter' ],
      known: 'Water puppets, Ha Long Bay nearby, pho, the Old Quarter',
      blurb: "Vietnam's capital curls around lakes beside the Red River and has been a seat of power for over a thousand years. Motorbikes outnumber cars many times over.",
      loot: 'a set of lacquered water puppets',
      art: { lm: 'laketower', style: 'old', water: 1, flora: 'palm', lx: 170 } }
  ];
})(window.MB = window.MB || {});
