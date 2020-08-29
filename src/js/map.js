const Stage = require('stage-js/platform/web');
const Const = require('./const.js');

const DEFAULT_COLS = 30;
const DEFAULT_ROWS = 30;

export class Map {
  constructor(world, data) {
    this.version = data.room_data.updated_at;
    this.layers = data.room_data.data;

    this.world = world;

    console.log(this.layers);

    this.cols = DEFAULT_COLS;
    this.rows = DEFAULT_ROWS;

    if (this.layers._cols) {
      this.cols = parseInt(this.layers._cols);
    }
    if (this.layers._rows) {
      this.rows = parseInt(this.layers._rows);
    }

    this.objects = {};
    data.objects.map((o) => {
      if ('undefined' === typeof o.data) return;
      if (null === o.data) return;

      this.objects[o.object_id] = o.data;
    });

    this.zObjs = {};
  }

  insert(box, boxZ) {
    if (boxZ === undefined) {
      box.appendTo(this.world);
      return;
    }

    if (boxZ in this.zObjs) {
      box.insertAfter(this.zObjs[boxZ]);
      return;
    }

    let bestZ = null;
    for (let z in this.zObjs) {
      if (bestZ === null || boxZ < z) {
        bestZ = z;
      }
    }
    box.insertAfter(this.zObjs[bestZ]);
  }

  toTileCoord(x) {
    return Math.floor(x / Const.TILE_SIZE);
  }

  isSolidTile(x, y) {
    const c = this.toTileCoord(x);
    const r = this.toTileCoord(y);
    if (0 <= r && r < this.rows && 0 <= c && c < this.cols) {
      return true === this.layers.wall[r * this.cols + c];
    } else {
      return true;
    }
  }

  _createBox(img, x, y, z) {
      if (!(z in this.zObjs)) {
        this.zObjs[z] = Stage.create();
      }
      const o = Stage.image(img);
      o.appendTo(this.zObjs[z]);
      o.pin({offsetX: x, offsetY: y});
  }

  initializeObjectLayer() {
    const objects = this.layers.object;
    const _getTile = (r, c) => {
      if (0 <= r && r < this.rows && 0 <= c && c < this.cols) {
        return objects[r * this.cols + c];
      }
    }
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        const img = _getTile(r, c);
        if (img !== null) {
          this._createBox(img, c * Const.TILE_SIZE, r * Const.TILE_SIZE, r - 1);
        }
      }
    }
  }

  initializeGroundLayer() {
    const ground = this.layers.ground;
    const _getTile = (r, c) => {
      if (0 <= r && r < this.rows && 0 <= c && c < this.cols) {
        return ground[r * this.cols + c];
      }
    }

    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        let img = _getTile(r, c);
        this._createBox(img, c * Const.TILE_SIZE, r * Const.TILE_SIZE, -1);
      }
    }
  }

  initializeWallLayer() {
    const wall = this.layers.wall;
    const _isWall = (r, c) => {
      return 0 <= r && r < this.rows && 0 <= c && c < this.cols && true === wall[r * this.cols + c];
    };

    for (let c = 0; c < this.cols; c++) {
      for (let r = -1; r < this.rows; r++) {
        if (true === _isWall(r + 1, c)) {
          let img = 'roof_';
          if (true === _isWall(r, c)) {
            img += 'u';
          }
          if (true === _isWall(r + 1, c + 1)) {
            img += 'r';
          }
          if (true === _isWall(r + 2, c)) {
            img += 'd';
          }
          if (true === _isWall(r + 1, c - 1)) {
            img += 'l';
          }
          this._createBox(img, c * Const.TILE_SIZE, r * Const.TILE_SIZE, r + 1);
        } else if (true === _isWall(r, c)) {
          let img = 'tile:wall_';
          if (true === _isWall(r, c - 1)) {
            img += 'l';
          }
          if (true === _isWall(r, c + 1)) {
            img += 'r';
          }
          this._createBox(img, c * Const.TILE_SIZE, r * Const.TILE_SIZE, r);
        }
      }
    }
  }

  addObjectsToWorld() {
    let zs = [];
    for (const z in this.zObjs) {
      zs.push(parseInt(z));
    }
    zs.sort((a, b) => a - b);
    for (const z of zs) {
      this.zObjs[z].appendTo(this.world);
    }
  }

  init() {
    this.initializeGroundLayer();
    this.initializeObjectLayer();
    this.initializeWallLayer();
    this.addObjectsToWorld();
  }
}


export async function loadMap(world, mapId) {
  const response = await fetch(
      `${Const.API_URL}rpg/getroom?room=${encodeURIComponent(mapId)}`);
  const data = (await response.json()).data;
  const map = new Map(world, data);
  return map;
}
