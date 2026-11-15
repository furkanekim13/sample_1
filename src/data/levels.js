const hazard = (type, x, y, size = 1, extra = {}) => ({ type, x, y, size, ...extra });
const item = (type, x, y) => ({ type, x, y });

export const LEVELS = [
  {
    name: 'The Forgotten Forest',
    subtitle: 'Where the last seeds remember',
    color: 0xd8873e,
    deep: 0x17130f,
    length: 4.1,
    hazards: [
      hazard('spikes', .24, .81, .8), hazard('blade', .39, .39, .8),
      hazard('spikes', .55, .22, .9), hazard('destructible', .68, .69, .8),
      hazard('blade', .82, .47, .75), hazard('spikes', .94, .78, .9)
    ],
    items: [
      item('orb', .17, .45), item('orb', .31, .56), item('shrink', .48, .64),
      item('orb', .62, .39), item('clone', .75, .3), item('grow', .84, .68), item('orb', .9, .55)
    ]
  },
  {
    name: 'The Machine Garden',
    subtitle: 'A quiet forest, kept alive by gears',
    color: 0xe7a94b,
    deep: 0x161310,
    length: 4.35,
    hazards: [
      hazard('gear', .2, .43, .9), hazard('platform', .31, .7, 1, { drift: 76 }),
      hazard('saw', .43, .3, .8, { drift: 84 }), hazard('crusher', .57, .51, .8, { drift: 72 }),
      hazard('gear', .71, .72, .9), hazard('laser', .84, .39, .9, { drift: 56 }),
      hazard('saw', .96, .6, .75, { drift: 68 }), hazard('tunnel', .91, .51, .8)
    ],
    items: [
      item('orb', .15, .66), item('speed', .29, .38), item('orb', .4, .57),
      item('clone', .53, .28), item('shield', .68, .42), item('orb', .88, .66)
    ]
  },
  {
    name: 'The Deep Abyss',
    subtitle: 'Something stirs beneath the roots',
    color: 0x79a79a,
    deep: 0x0c1313,
    length: 4.25,
    hazards: [
      hazard('rock', .19, .22, .8, { drift: 44 }), hazard('spikes', .32, .83, 1),
      hazard('saw', .46, .52, .9, { drift: 104 }), hazard('rock', .58, .37, 1, { drift: 38 }),
      hazard('platform', .7, .72, 1.1, { drift: 68 }), hazard('blade', .83, .3, .9),
      hazard('spikes', .96, .82, .9)
    ],
    items: [
      item('orb', .14, .5), item('gravity', .28, .42), item('orb', .4, .23),
      item('clone', .54, .65), item('shield', .68, .39), item('orb', .89, .52)
    ]
  },
  {
    name: 'The Red Factory',
    subtitle: 'The engine still dreams in fire',
    color: 0xef684b,
    deep: 0x1a100f,
    length: 4.4,
    hazards: [
      hazard('crusher', .19, .46, 1, { drift: 104 }), hazard('gear', .33, .72, 1),
      hazard('laser', .46, .3, 1, { drift: 80 }), hazard('saw', .59, .58, 1, { drift: 116 }),
      hazard('crusher', .72, .43, .9, { drift: 92 }), hazard('laser', .85, .72, .9, { drift: 70 }),
      hazard('blade', .97, .37, 1)
    ],
    items: [
      item('orb', .13, .67), item('speed', .28, .3), item('clone', .43, .65),
      item('shield', .57, .28), item('orb', .73, .66), item('gravity', .88, .44)
    ]
  },
  {
    name: 'The Last Light',
    subtitle: 'Carry a spark beyond the end',
    color: 0xf2bd69,
    deep: 0x16120f,
    length: 4.55,
    hazards: [
      hazard('blade', .16, .35, 1), hazard('spikes', .28, .82, 1),
      hazard('crusher', .4, .51, 1, { drift: 100 }), hazard('saw', .53, .28, 1, { drift: 110 }),
      hazard('laser', .66, .72, .95, { drift: 92 }), hazard('rock', .77, .39, 1, { drift: 54 }),
      hazard('gear', .89, .58, 1), hazard('spikes', .99, .82, .9)
    ],
    items: [
      item('orb', .12, .59), item('clone', .25, .35), item('shield', .39, .73),
      item('speed', .52, .5), item('orb', .64, .29), item('gravity', .77, .68),
      item('orb', .91, .32)
    ]
  }
];
