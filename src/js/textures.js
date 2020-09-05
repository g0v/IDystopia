const Stage = require('stage-js/platform/web');
const Const = require('./const.js');

const TILE_MAP = {
  'screen_lt': [34, 34],
  'screen_t': [36, 34],
  'screen_rt': [35, 34],
  'screen_l': [36, 35],
  'screen_c': [38, 34],
  'screen_r': [37, 34],
  'screen_lb': [34, 35],
  'screen_b': [37, 35],
  'screen_rb': [35, 35],
  'carpet1_1': [2, 11],
  'carpet1_2': [3, 11],
  'carpet1_3': [5, 11],
  'computer_table1': [12, 3],
  'computer_table2': [12, 4],
  'ground': [18, 1],
  'ground1': [1, 0],
  'ground2': [2, 0],
  'ground3': [3, 0],
  'ground4': [4, 0],
  'ground5': [5, 0],
  'ground6': [6, 0],
  'ground7': [7, 0],
  'pile': [7, 6],
  'wall_': [0, 2],
  'wall_l': [2, 2],
  'wall_r': [1, 2],
  'wall_lr': [3, 2],
  'roof_': [14, 1],
  'roof_u': [7, 2],
  'roof_r': [1, 1],
  'roof_ur': [8, 2],
  'roof_d': [7, 1],
  'roof_ud': [10, 2],
  'roof_rd': [8, 1],
  'roof_urd': [6, 1],
  'roof_l': [2, 1],
  'roof_ul': [9, 2],
  'roof_rl': [10, 1],
  'roof_url': [6, 2],
  'roof_dl': [9, 1],
  'roof_udl': [5, 2],
  'roof_rdl': [5, 1],
  'roof_urdl': [15, 2],
  'chair': [10, 13],
  'tableA_1': [6, 13],
  'tableA_2': [7, 13],
  'tableA_3': [6, 14],
  'tableA_4': [7, 14],
  'bar_u': [2, 12],
  'bar_l': [2, 13],
  'bar_r': [0, 14],
  'bar_ul': [12, 12],
  'bar_d': [13, 12],
  'bar_lr': [1, 14],
  'bar_ud': [3, 13],
  'food_a': [3, 5],
  'food_b': [3, 6],
  'food_c': [4, 6],
};

function addTextTexture() {
  Stage({
    textures : {
      text : function(text, style) {
        text += '';
        style = style || {};
        return Stage.canvas(function(ctx) {
          var ratio = 2;

          ctx.font = style.font || 'normal 12px Arial';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
          ctx.textAlign = 'center';
          const dim = ctx.measureText(text);

          this.size(dim.width, 12, ratio);
          ctx.scale(ratio, ratio);
          // TODO(stimim): figure out why do we need to set this again...
          // I guess this is related to the "ratio" setting.
          ctx.font = style.font || 'normal 12px Arial';
          ctx.textBaseline = 'top';
          ctx.strokeText(text, 0, 0);

          ctx.fillStyle = style.fillStyle || 'white';
          ctx.fillText(text, 0, 0);
        });
      }
    }
  });
}

export function loadTextures() {
  addTextTexture();

  const textures = {};

  for (const key in TILE_MAP) {
    const c = TILE_MAP[key][0];
    const r = TILE_MAP[key][1];
    textures[key] = {
      x: c * Const.TILE_SIZE,
      y: r * Const.TILE_SIZE,
      width: Const.TILE_SIZE,
      height: Const.TILE_SIZE,
    };
  }

  Stage({
    name: 'tile',
    image : '/sprite/open_tileset.png',
    textures : textures
  });
}
