/*
  Catalog data. Edit products and categories here; the page renders from it.
  Everything below is SAMPLE content: swap names, specs and photos for the
  real ones before the site goes live. Photos are Unsplash placeholders.
*/

export const BRAND = {
  name: 'Micah Angela',
  email: 'sales@example.com',
  phone: '+63 900 000 0000',
  messenger: 'https://m.me/',
  viber: 'viber://chat?number=',
};

// Linen groups, in the order the filter buttons show them.
export const GROUPS = [
  { id: 'hospital', label: 'Hospital', long: 'Hospital linens' },
  { id: 'hotel', label: 'Hotel & resort', long: 'Hotel & resort linens' },
  { id: 'bath', label: 'Bath & spa', long: 'Bath & spa' },
  { id: 'banquet', label: 'Table & banquet', long: 'Table & banquet linens' },
];

/*
  Photo slots. Each value is an images.unsplash.com base URL (no query string).
  Replace with your own product photos later, e.g. "assets/img/gowns.jpg".
*/
const U = (id) => `https://images.unsplash.com/photo-${id}`;

export const PHOTOS = {
  door_hospital: U('1538108149393-fbbd81895907'),
  door_hotel: U('1582582621959-48d27397dc69'),
  door_events: U('1775918427144-51f0bf53f8c4'),
  linen_hosp_bedsheet: U('1613377512409-59c33c10c821'),
  linen_drawsheet: U('1519494080410-f9aa76cb4283'),
  linen_gown: U('1606166155766-87872211cd0e'),
  linen_scrubs: U('1666887360921-85952a86894f'),
  linen_curtain: U('1648224395331-06117e433549'),
  linen_blanket: U('1600369672770-985fd30004eb'),
  linen_or: U('1551076805-e1869033e561'),
  linen_pillowcase: U('1564019472017-b51398323027'),
  linen_hotel_sheetset: U('1619128395560-8a749ac9926d'),
  linen_duvet: U('1549638441-b787d2e11f14'),
  linen_hotel_protector: U('1688384452551-5cacc39946e0'),
  linen_towels: U('1684248655527-46bee8e79029'),
  linen_robe: U('1704428381445-dc61b037cfd2'),
  linen_pooltowel: U('1764114656382-6ad79e1a6b42'),
  linen_tablecloth: U('1620735692151-26a7e0748429'),
  linen_napkins: U('1480455454781-1af590be2a58'),
  linen_chaircover: U('1737427649620-9c971b5ebcb4'),
  cat_amenities: U('1540555700478-4be289fbecef'),
  cat_furniture: U('1631049035486-58f342e9c6a9'),
  cat_housekeeping: U('1582735689369-4fe89db7114c'),
  cat_dining: U('1555244162-803834f70033'),
  cat_bathroom: U('1584622650111-993a426fbf0a'),
  cat_poolside: U('1549294413-26f195200c16'),
  cat_stage: U('1568989357443-057c03fb10fc'),
  cat_dancefloor: U('1669173034210-2e71d1d86fbf'),
  cat_decor: U('1737236119003-b9ff5b2b5c16'),
  story: U('1534639077088-d702bcf685e7'),
  feature_stage: U('1765568408601-481b13b02e71'),
  swatches: U('1524404794194-16bae22718c0'),
};

// Second choice for each slot, used automatically if the first photo fails to load.
export const PHOTO_BACKUPS = {
  door_hospital: U('1512678080530-7760d81faba6'),
  door_hotel: U('1549638441-b787d2e11f14'),
  door_events: U('1524824267900-2fa9cbf7a506'),
  linen_hosp_bedsheet: U('1512677859289-868722942457'),
  linen_drawsheet: U('1512678080530-7760d81faba6'),
  linen_gown: U('1588571591480-497b05f2d873'),
  linen_scrubs: U('1706799191377-96a80beaee24'),
  linen_curtain: U('1648224395352-812a6ce3431c'),
  linen_blanket: U('1515451078722-6236ea8186d4'),
  linen_or: U('1516549655169-df83a0774514'),
  linen_pillowcase: U('1598535746036-87d13382f6a6'),
  linen_hotel_sheetset: U('1639690222869-1e608aa51f82'),
  linen_duvet: U('1582582621959-48d27397dc69'),
  linen_hotel_protector: U('1639690222869-1e608aa51f82'),
  linen_towels: U('1728034261564-18930dcb2c8e'),
  linen_robe: U('1704428381445-dc61b037cfd2'),
  linen_pooltowel: U('1764114656405-0a646cb6dd17'),
  linen_tablecloth: U('1511795409834-ef04bbd61622'),
  linen_napkins: U('1596433904500-97b901c5d274'),
  linen_chaircover: U('1525844767700-c64349d96399'),
  cat_amenities: U('1750271336429-8b0a507785c0'),
  cat_furniture: U('1587702068694-a909ef4aa346'),
  cat_housekeeping: U('1635274605638-d44babc08a4f'),
  cat_dining: U('1774025967891-b4ed833e57ac'),
  cat_bathroom: U('1564540583246-934409427776'),
  cat_poolside: U('1559294170-f7e6a2f1f0fd'),
  cat_stage: U('1762709118823-7fe9c9afa8ff'),
  cat_dancefloor: U('1558350870-cd7a91ff87ba'),
  cat_decor: U('1789163624444-cb22c013f8aa'),
  story: U('1476683874822-744764a2438f'),
  feature_stage: U('1779308936221-89739e035a53'),
  swatches: U('1545042746-ec9e5a59b359'),
};

export function photoUrl(key, width = 800) {
  const src = PHOTOS[key];
  if (!src) return '';
  if (!src.startsWith('https://images.unsplash.com/')) return src;
  return `${src}?auto=format&fit=crop&w=${width}&q=70`;
}

export function photoSrcset(key, widths = [400, 700, 1000]) {
  const src = PHOTOS[key];
  if (!src || !src.startsWith('https://images.unsplash.com/')) return '';
  return widths.map((w) => `${photoUrl(key, w)} ${w}w`).join(', ');
}

export const LINENS = [
  {
    id: 'hospital-sheets',
    name: 'Hospital Flat & Fitted Sheets',
    group: 'hospital',
    photo: 'linen_hosp_bedsheet',
    spec: 'Poly-cotton · White, light blue, light green',
    about: 'Cut for hospital beds, with deep fitted corners so they stay on when the backrest goes up and down all day.',
    details: {
      Fabric: 'Poly-cotton or 100% cotton',
      Sizes: 'Standard hospital bed, or send us your mattress size',
      Colors: 'White, light blue, light green',
      Options: 'Hospital name printed or embroidered on the hem',
    },
  },
  {
    id: 'draw-sheets',
    name: 'Draw Sheets',
    group: 'hospital',
    photo: 'linen_drawsheet',
    spec: 'Half-width sheet · Waterproof option',
    about: 'The narrow sheet across the middle of the bed. Two nurses can turn or lift a patient with it, and it changes without stripping the whole bed.',
    details: {
      Fabric: 'Poly-cotton, with an optional waterproof layer',
      Sizes: 'Hospital bed width',
      Colors: 'White, light blue',
      Options: 'Waterproof backing',
    },
  },
  {
    id: 'patient-gowns',
    name: 'Patient Gowns',
    group: 'hospital',
    photo: 'linen_gown',
    spec: 'Tie-back · Adult and pediatric',
    about: 'Tie-back gowns with snap or tie sleeves, so an IV line doesn\'t have to come out for a change.',
    details: {
      Fabric: 'Soft poly-cotton',
      Sizes: 'S to 3XL, plus pediatric',
      Colors: 'Solids or prints, one per ward if you like',
      Options: 'Snap shoulders, hospital print',
    },
  },
  {
    id: 'scrub-suits',
    name: 'Scrub Suits',
    group: 'hospital',
    photo: 'linen_scrubs',
    spec: 'Tops and pants · XS to 3XL',
    about: 'Scrubs for doctors, nurses and OR staff, in colors that tell departments apart at a glance.',
    details: {
      Fabric: 'Poly-cotton or poly-rayon stretch',
      Sizes: 'XS to 3XL',
      Colors: 'Navy, ceil blue, hunter green, wine, and more',
      Options: 'Embroidered name and department',
    },
  },
  {
    id: 'privacy-curtains',
    name: 'Privacy Curtains',
    group: 'hospital',
    photo: 'linen_curtain',
    spec: 'Mesh top · Made to your track',
    about: 'Cubicle curtains for wards and ER bays. The mesh top lets air and light through while the bed stays private.',
    details: {
      Fabric: 'Polyester, with a flame-retardant option',
      Sizes: 'Measured to your ceiling track',
      Colors: 'Solids and quiet prints',
      Options: 'Mesh top, hooks or gliders',
    },
  },
  {
    id: 'thermal-blankets',
    name: 'Thermal Blankets',
    group: 'hospital',
    photo: 'linen_blanket',
    spec: 'Cellular weave · Single size',
    about: 'Open cellular weave that holds warmth, still breathes in an air-conditioned ward, and dries fast.',
    details: {
      Fabric: 'Cotton cellular weave',
      Sizes: 'Single and hospital bed',
      Colors: 'White, light blue',
      Options: 'Bulk packs per ward',
    },
  },
  {
    id: 'or-linens',
    name: 'OR Linens & Wrappers',
    group: 'hospital',
    photo: 'linen_or',
    spec: 'Drapes, towels, wrappers',
    about: 'Surgical drapes, OR towels and instrument wrappers for operating and delivery rooms.',
    details: {
      Fabric: 'Tightly woven cotton or poly-cotton',
      Sizes: 'Built around your OR pack list',
      Colors: 'Surgical green, blue',
      Options: 'Fenestrated drapes, custom packs',
    },
  },
  {
    id: 'hospital-pillows',
    name: 'Pillows & Pillowcases',
    group: 'hospital',
    photo: 'linen_pillowcase',
    spec: 'Wipe-clean pillows · Envelope cases',
    about: 'Wipe-clean pillows for patient rooms, with envelope-close cases that never leave a zipper against a cheek.',
    details: {
      Fabric: 'Poly-cotton cases, waterproof pillow covers',
      Sizes: 'Standard',
      Colors: 'White, light blue',
      Options: 'Envelope or zip closure',
    },
  },
  {
    id: 'hotel-sheet-sets',
    name: 'Hotel Sheet Sets',
    group: 'hotel',
    photo: 'linen_hotel_sheetset',
    spec: 'Sateen stripe or plain · Single to king',
    about: 'The crisp white bed guests take photos of. Sateen stripe or plain weave, in every bed size you run.',
    details: {
      Fabric: 'Cotton sateen or percale',
      Sizes: 'Single, double, queen, king, plus custom',
      Colors: 'White, ivory, tone-on-tone stripe',
      Options: 'Your logo embroidered on the hem',
    },
  },
  {
    id: 'duvets',
    name: 'Duvets & Duvet Covers',
    group: 'hotel',
    photo: 'linen_duvet',
    spec: 'Light fill for the tropics',
    about: 'Lofty inserts with covers that come off for washing between guests. Light fill so rooms don\'t feel heavy in the heat.',
    details: {
      Fabric: 'Down-alternative fill, cotton covers',
      Sizes: 'Single to king',
      Colors: 'White',
      Options: 'Light or all-season fill',
    },
  },
  {
    id: 'mattress-protectors',
    name: 'Mattress Protectors',
    group: 'hotel',
    photo: 'linen_hotel_protector',
    spec: 'Waterproof · Fitted like a sheet',
    about: 'Waterproof, quiet under a sleeping guest, and fitted like a sheet so housekeeping can change it fast.',
    details: {
      Fabric: 'Cotton terry top, waterproof backing',
      Sizes: 'Single to king, and hospital bed',
      Colors: 'White',
      Options: 'Skirted or elastic corners',
    },
  },
  {
    id: 'bath-towels',
    name: 'Bath, Hand & Face Towels',
    group: 'bath',
    photo: 'linen_towels',
    spec: '100% cotton terry · Sets or by piece',
    about: 'Heavier towels for hotel rooms, lighter ones for resorts that turn rooms fast. Same look across every size.',
    details: {
      Fabric: '100% cotton terry',
      Sizes: 'Face, hand, bath, bath sheet',
      Colors: 'White, plus colors on request',
      Options: 'Woven border, embroidered logo',
    },
  },
  {
    id: 'bathrobes',
    name: 'Bathrobes',
    group: 'bath',
    photo: 'linen_robe',
    spec: 'Waffle or terry · S to XL',
    about: 'Waffle robes for spas and warm rooms, terry robes for suites. Shawl collar, two pockets, belt loops that hold.',
    details: {
      Fabric: 'Cotton waffle or terry',
      Sizes: 'S to XL',
      Colors: 'White, gray',
      Options: 'Embroidered logo',
    },
  },
  {
    id: 'pool-towels',
    name: 'Pool & Beach Towels',
    group: 'bath',
    photo: 'linen_pooltowel',
    spec: 'Bold stripes · Oversized',
    about: 'Big striped towels, so pool staff can spot resort towels from across the deck.',
    details: {
      Fabric: 'Cotton terry, yarn-dyed stripes',
      Sizes: 'Oversized pool size',
      Colors: 'Stripes in your resort colors',
      Options: 'Woven resort name',
    },
  },
  {
    id: 'tablecloths',
    name: 'Tablecloths & Skirting',
    group: 'banquet',
    photo: 'linen_tablecloth',
    spec: 'Round and banquet · Pleated skirting',
    about: 'Round and rectangular cloths for banquets, plus pleated skirting for buffet and registration tables.',
    details: {
      Fabric: 'Polyester or poly-cotton',
      Sizes: 'Cut to your table sizes',
      Colors: 'White, ivory, black, and event colors',
      Options: 'Overlays and runners',
    },
  },
  {
    id: 'table-napkins',
    name: 'Table Napkins',
    group: 'banquet',
    photo: 'linen_napkins',
    spec: 'Holds a fold · Bulk packs',
    about: 'Cloth napkins with enough body to hold a fold on a banquet setup.',
    details: {
      Fabric: 'Polyester or cotton',
      Sizes: '20 x 20 in and custom',
      Colors: 'White plus the event palette',
      Options: 'Hemmed or mitered corners',
    },
  },
  {
    id: 'chair-covers',
    name: 'Chair Covers & Sashes',
    group: 'banquet',
    photo: 'linen_chaircover',
    spec: 'Stretch or tie-back',
    about: 'Covers for banquet and monobloc chairs, with sashes in the motif of the day.',
    details: {
      Fabric: 'Spandex stretch or polyester',
      Sizes: 'Fitted to your chair model',
      Colors: 'White, ivory, black; sashes in any color',
      Options: 'Organza or satin sashes',
    },
  },
];

// Everything beyond linens, kept at category level so the page stays simple.
export const CATEGORIES = [
  {
    id: 'amenities',
    name: 'Guest Room Amenities',
    photo: 'cat_amenities',
    blurb: 'The small things guests notice first.',
    items: ['Toiletry kits and dispensers', 'Slippers', 'Dental and shaving kits', 'Hangers and laundry bags', 'Do-not-disturb signs'],
  },
  {
    id: 'furniture',
    name: 'Room & Lobby Furniture',
    photo: 'cat_furniture',
    blurb: 'From the bed frame to the lobby sofa.',
    items: ['Beds and headboards', 'Bedside tables and desks', 'Luggage racks', 'Lounge chairs', 'Lobby seating'],
  },
  {
    id: 'housekeeping',
    name: 'Housekeeping & Laundry',
    photo: 'cat_housekeeping',
    blurb: 'What your housekeeping team pushes, carries and bags all day.',
    items: ['Housekeeping carts', 'Linen trolleys', 'Laundry hampers', 'Room bins', 'Cleaning caddies'],
  },
  {
    id: 'dining',
    name: 'Dining & Banquet',
    photo: 'cat_dining',
    blurb: 'Buffets, plated dinners and coffee breaks.',
    items: ['Banquet tables and chairs', 'Chafing dishes', 'Plates, glassware and flatware', 'Buffet risers', 'Serving trays'],
  },
  {
    id: 'bathroom',
    name: 'Bathroom & Spa',
    photo: 'cat_bathroom',
    blurb: 'Fixtures and extras for baths and spa rooms.',
    items: ['Bath mats', 'Soap and shampoo dispensers', 'Hair dryers', 'Spa beds', 'Towel racks'],
  },
  {
    id: 'poolside',
    name: 'Poolside & Outdoor',
    photo: 'cat_poolside',
    blurb: 'Loungers, shade and towel stations.',
    items: ['Pool loungers', 'Umbrellas', 'Cabanas', 'Towel stations', 'Outdoor tables'],
  },
  {
    id: 'stages',
    name: 'Stages & Risers',
    photo: 'cat_stage',
    blurb: 'For programs, bands and the couple\'s table.',
    items: ['Modular stage platforms', 'Risers and steps', 'Stage skirting', 'Podiums', 'Ramps'],
  },
  {
    id: 'dance-floors',
    name: 'Dance Floors',
    photo: 'cat_dancefloor',
    blurb: 'Wood, black and white, or LED.',
    items: ['Wooden dance floors', 'Black and white checkered floors', 'LED dance floors', 'Edge trims and ramps'],
  },
  {
    id: 'decor',
    name: 'Drapery & Event Decor',
    photo: 'cat_decor',
    blurb: 'Fabric again, just a lot more of it.',
    items: ['Ceiling drapes', 'Stage backdrops', 'Pipe and drape', 'Aisle runners', 'Table centerpieces'],
  },
];

export const FACILITIES = [
  {
    id: 'hospital',
    name: 'Hospitals & clinics',
    photo: 'door_hospital',
    text: 'Bedsheets, draw sheets, patient gowns, scrubs, privacy curtains and OR linens.',
    short: 'Sheets, gowns, scrubs, privacy curtains and OR linens.',
    cta: 'See hospital linens',
    filter: 'hospital',
    tag: 'Our specialty',
  },
  {
    id: 'hotel',
    name: 'Hotels & resorts',
    photo: 'door_hotel',
    text: 'Sheet sets, duvets, towels and robes, plus amenities and furniture for every room.',
    short: 'Sheet sets, towels and robes, plus amenities and furniture.',
    cta: 'See hotel linens',
    filter: 'hotel',
  },
  {
    id: 'events',
    name: 'Events & function halls',
    photo: 'door_events',
    text: 'Tablecloths, napkins and chair covers, then the drapery, stage and dance floor.',
    short: 'Table linen, drapery, stages and dance floors.',
    cta: 'See banquet linens',
    filter: 'banquet',
  },
];
