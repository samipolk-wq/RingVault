/**
 * The Ring Vault — ring design taxonomy.
 * Sourced from the original 2013 "Ring Vault Framework" variables sheet,
 * refined in the 2026 prototypes. Every group allows a free-text write-in:
 * the founding rule is "never limited by the options."
 */

export type Option = { icon: string; label: string };
export type Group = {
  sub: string;
  field: string;
  opts: Option[];
  writeIn: string; // placeholder text for the write-in input
};
export type Step = {
  key: string;
  title: string; // may contain <em> for italics
  hint: string;
  groups?: Group[];
  slider?: boolean;
  optional?: boolean;
};

export const STEPS: Step[] = [
  {
    key: 'stoneType',
    title: 'Your <em>stone</em>',
    hint: 'The one that actually stops you when you see it.',
    groups: [
      {
        sub: 'Type of Stone',
        field: 'Stone Type',
        opts: [
          { icon: 'diamond', label: 'Diamond' },
          { icon: 'ruby', label: 'Ruby' },
          { icon: 'emeraldst', label: 'Emerald' },
          { icon: 'sapphire', label: 'Sapphire' }
        ],
        writeIn: 'Something no list would think to offer? Name it…'
      }
    ]
  },
  {
    key: 'stoneShape',
    title: 'The <em>cut</em>',
    hint: 'The shape people notice first, and the one you’ll catch out of the corner of your eye for fifty years. Choose it on purpose.',
    groups: [
      {
        sub: 'Shape of Stone',
        field: 'Stone Shape',
        opts: [
          { icon: 'emeraldcut', label: 'Emerald Cut' },
          { icon: 'princess', label: 'Princess' },
          { icon: 'cushion', label: 'Cushion' },
          { icon: 'round', label: 'Round' },
          { icon: 'marquise', label: 'Marquise' },
          { icon: 'oval', label: 'Oval' },
          { icon: 'radiant', label: 'Radiant' },
          { icon: 'asscher', label: 'Asscher' }
        ],
        writeIn: 'A shape we have missed? Write it in…'
      }
    ]
  },
  {
    key: 'stoneQuality',
    title: 'Quality of <em>stone</em>',
    hint: 'Decide what matters most to you. Whatever you pick is the right answer.',
    groups: [
      {
        sub: 'Quality Priority',
        field: 'Stone Quality',
        opts: [
          { icon: 'spark', label: 'Color First' },
          { icon: 'princess', label: 'Cut First' },
          { icon: 'round', label: 'Clarity First' },
          { icon: 'tux', label: 'I trust their judgment here' }
        ],
        writeIn: 'Your own rule of thumb? Say it plainly…'
      }
    ]
  },
  {
    key: 'stoneSize',
    title: 'Size of <em>stone</em>',
    hint: 'Your floor, and your dream. Be honest about both.',
    slider: true
  },
  {
    key: 'style',
    title: 'Your <em>style</em>',
    hint: 'Classic, strange, heirloom, or nothing anyone has seen. Your hand, your call.',
    groups: [
      {
        sub: 'Ring Style',
        field: 'Style',
        opts: [
          { icon: 'ring', label: 'Classic Solitaire' },
          { icon: 'vintage', label: 'Vintage' },
          { icon: 'ruby', label: 'Gemstone' },
          { icon: 'band', label: 'Sidestone' },
          { icon: 'halo', label: 'Halo' },
          { icon: 'three', label: 'Three Stone' }
        ],
        writeIn: 'Nothing here is you? Describe what is…'
      }
    ]
  },
  {
    key: 'band',
    title: 'The <em>band</em>',
    hint: 'The part that touches your skin every hour of every day. Worth an opinion.',
    groups: [
      {
        sub: 'Type of Metal',
        field: 'Metal',
        opts: [
          { icon: 'band', label: 'Platinum' },
          { icon: 'band', label: '14K White Gold' },
          { icon: 'band', label: '18K White Gold' },
          { icon: 'band', label: '18K Yellow Gold' },
          { icon: 'band', label: '18K Rose Gold' }
        ],
        writeIn: 'Another metal entirely?…'
      },
      {
        sub: 'Stones on the Band',
        field: 'Band Stones',
        opts: [
          { icon: 'none', label: 'None' },
          { icon: 'halo', label: 'Half Wrap' },
          { icon: 'halo', label: 'Three-Quarter Wrap' },
          { icon: 'halo', label: 'Full Wrap' }
        ],
        writeIn: 'Something different? Write it in…'
      },
      {
        sub: 'Band Setting',
        field: 'Band Setting',
        opts: [
          { icon: 'spark', label: 'Pavé' },
          { icon: 'spark', label: 'Micropavé' },
          { icon: 'band', label: 'Channel' }
        ],
        writeIn: 'Another setting? Write it in…'
      }
    ]
  },
  {
    key: 'setting',
    title: 'The <em>setting</em>',
    hint: 'How your stone sits, and how it catches light when you move.',
    groups: [
      {
        sub: 'Setting Style',
        field: 'Setting',
        opts: [
          { icon: 'halo', label: 'Halo' },
          { icon: 'ring', label: 'Four Prong' },
          { icon: 'ring', label: 'Six Prong' },
          { icon: 'round', label: 'Bezel' }
        ],
        writeIn: 'You have a better idea? Write it…'
      }
    ]
  },
  {
    key: 'inscription',
    title: 'The <em>inscription</em>',
    hint: 'Words only the two of you will ever read. Or words only you will.',
    groups: [
      {
        sub: 'Engrave',
        field: 'Inscription',
        opts: [
          { icon: 'quill', label: 'A Quote' },
          { icon: 'cal', label: 'Wedding Date' },
          { icon: 'heart', label: 'Proposal Date' },
          { icon: 'letter', label: 'Our Names' },
          { icon: 'none', label: 'No Inscription' }
        ],
        writeIn: 'The exact words, if you know them…'
      }
    ]
  },
  {
    key: 'proposal',
    title: 'The <em>proposal</em>',
    hint: 'Optional, and specific if you like. You are allowed preferences about the most photographed moment of your life.',
    optional: true,
    groups: [
      {
        sub: 'The Ideal Spot',
        field: 'Spot',
        opts: [
          { icon: 'beach', label: 'The Beach' },
          { icon: 'mtn', label: 'A Mountaintop' },
          { icon: 'dine', label: 'A Restaurant' },
          { icon: 'spark', label: 'Surprise Me' }
        ],
        writeIn: 'Somewhere only the two of you would understand?…'
      },
      {
        sub: 'Surprises',
        field: 'Surprise',
        opts: [
          { icon: 'spark', label: 'I love surprises' },
          { icon: 'letter', label: 'Please, no surprises' }
        ],
        writeIn: ''
      },
      {
        sub: 'Ask My Parents First?',
        field: 'Parents',
        opts: [
          { icon: 'fam', label: 'Yes, please' },
          { icon: 'none', label: 'Not necessary' }
        ],
        writeIn: ''
      },
      {
        sub: 'Who Is There?',
        field: 'Audience',
        opts: [
          { icon: 'two', label: 'Just the two of us' },
          { icon: 'fam', label: 'Family near' },
          { icon: 'heart', label: 'Dearest friends' },
          { icon: 'spark', label: 'Everyone we love' }
        ],
        writeIn: ''
      }
    ]
  }
];

/** Ring size options from the 2013 variables sheet (US sizes 3–13). */
export const RING_SIZES: string[] = Array.from({ length: 41 }, (_, i) =>
  (3 + i * 0.25).toFixed(2).replace(/\.?0+$/, '')
);

/** Connoisseur details (optional) from the original spec. */
export const CONNOISSEUR_DETAILS = [
  'Polish', 'Symmetry', 'Depth %', 'Table %', 'Fluorescence', 'Price / Ct', 'Culet'
];
