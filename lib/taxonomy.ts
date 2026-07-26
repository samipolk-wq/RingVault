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
    hint: 'Which stone speaks to you?',
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
        writeIn: 'Something else entirely? You are never limited — write it in…'
      }
    ]
  },
  {
    key: 'stoneShape',
    title: 'The <em>cut</em>',
    hint: 'The cut defines the character of your ring.',
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
        writeIn: 'A cut we missed? Write it in…'
      }
    ]
  },
  {
    key: 'stoneQuality',
    title: 'Quality of <em>stone</em>',
    hint: 'Color, cut, clarity — or leave it in their hands.',
    groups: [
      {
        sub: 'Quality Priority',
        field: 'Stone Quality',
        opts: [
          { icon: 'spark', label: 'Color First' },
          { icon: 'princess', label: 'Cut First' },
          { icon: 'round', label: 'Clarity First' },
          { icon: 'tux', label: "I'll leave it to them" }
        ],
        writeIn: 'Your own rule of thumb? Write it in…'
      }
    ]
  },
  {
    key: 'stoneSize',
    title: 'Size of <em>stone</em>',
    hint: 'Choose your minimum, and your dream.',
    slider: true
  },
  {
    key: 'style',
    title: 'Your <em>style</em>',
    hint: 'The personality your ring will carry.',
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
        writeIn: 'A style of your own? Write it in…'
      }
    ]
  },
  {
    key: 'band',
    title: 'The <em>band</em>',
    hint: 'The foundation of it all.',
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
        writeIn: 'Another metal? Write it in…'
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
    hint: 'What holds your stone in place.',
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
        writeIn: 'Another idea? Write it in…'
      }
    ]
  },
  {
    key: 'inscription',
    title: 'The <em>inscription</em>',
    hint: 'A secret message, engraved forever.',
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
    hint: 'An optional flourish — a few gentle hints. Skip freely.',
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
        writeIn: 'Somewhere only the two of you know? Write it in…'
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
