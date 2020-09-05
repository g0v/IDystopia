const Stage = require('stage-js/platform/web');
const Const = require('./const.js');

const CHAR_WIDTH = 32;
const CHAR_HEIGHT = 32;

export class Char {
  constructor(x, y, character, name) {
    if (Number.isNaN(x)) x = 0;
    if (Number.isNaN(y)) y = 0;
    this.targetX = x;
    this.targetY = y;
    this.x = x;
    this.y = y;
    this.character = character;
    this.name = name;
    this.messages = [];
    this.facing = 'DOWN';
    this.step = 1;
    this.missionMark = false;

    this.makeStageObj();
  }

  makeStageObj() {
    this.loadImage();

    this.imageBox = Stage.image(`${this.character}:${this.facing}_${this.step}`);
    this.imageBox.pin({handle: 0.0});

    this.nameBox = Stage.string('text');
    this.nameBox.value(this.name);
    this.nameBox.pin({handleX: 0.5});

    this.missionMarkBox = Stage.string('text');
    this.missionMarkBox.value('!');
    this.missionMarkBox.pin({handleX: 0.5});
    this.missionMarkBox.hide();

    this.outlineBox = Stage.image();
    this.outlineBox.pin({handle: 0.0});
    this.outlineBox.image(Stage.canvas(function(ctx) {
      const ratio = 2;
      this.size(Const.TILE_SIZE, Const.TILE_SIZE, ratio);
      ctx.scale(ratio, ratio);
      ctx.beginPath();
      ctx.rect(0, 0, Const.TILE_SIZE, Const.TILE_SIZE);
      ctx.stroke();
    }));
  }

  appendTo(map) {
    const z = Math.floor(this.y / Const.TILE_SIZE);

    map.insert(this.imageBox, z);
    map.insert(this.nameBox);
    map.insert(this.missionMarkBox);
    map.insert(this.outlineBox);

    this.imageBox.pin({
      offsetX: this.x,
      offsetY: this.y,
    });

    this.nameBox.pin({
      offsetX: this.x + Const.TILE_SIZE / 2,
      offsetY: this.y + Const.TILE_SIZE,
    });
    this.missionMarkBox.pin({
      offsetX: this.x + Const.TILE_SIZE / 2,
      offsetY: this.y - Const.TILE_SIZE / 2,
    });

    this.outlineBox.pin({
      offsetX: this.x,
      offsetY: this.y,
    });
  }

  get WIDTH() {
    return 32;
  }

  get HEIGHT() {
    return 32;
  }

  get SPEED() {
    return 256;
  }

  loadImage() {
    if (!this.character) return;

    const src = `/sprite/${this.character}.png`;

    const rows = {
      DOWN: 0,
      LEFT: 1,
      RIGHT: 2,
      UP: 3,
    };
    let textures = {};
    for (const key in rows) {
      const dy = rows[key];
      for (let dx = 0; dx < 3; dx++) {
        textures[`${key}_${dx}`] = {
          x: dx * this.WIDTH,
          y: dy * this.HEIGHT,
          width: this.WIDTH,
          height: this.HEIGHT,
        };
      }
    }

    Stage({
      name: `${this.character}`,
      image: src,
      textures: textures,
    });
  }

  // moved by user input
  move(dt, dx, dy, map) {
    if (dx || dy) {
      let newX = this.x + dx * dt * this.SPEED;
      let newY = this.y + dy * dt * this.SPEED;

      // Check if we can move into the new location.
      // The check is more strict on X axis.
      // For Y axis, we only need to check for the center of the box, the
      // visual effect is good enough.
      if (map.isSolidTile(newX, newY + 16) && dx === -1) {
        newX = (Math.floor(newX / Const.TILE_SIZE) + 1) * Const.TILE_SIZE;
      }
      if (map.isSolidTile(newX + 31, newY + 16) && dx === 1) {
        newX = (Math.floor(newX / Const.TILE_SIZE)) * Const.TILE_SIZE;
      }
      if (map.isSolidTile(newX, newY + 16) ||
          map.isSolidTile(newX + 31, newY + 16)) {
        return;
      }

      this.x = newX;
      this.y = newY;
      this.targetX = this.x;
      this.targetY = this.y;

      if (dx) this.facing = dx > 0 ? 'RIGHT' : 'LEFT';
      if (dy) this.facing = dy > 0 ? 'DOWN' : 'UP';
      this.appendTo(map);
      this.step = Math.floor(Math.abs(this.x + this.y) / (this.WIDTH / 2)) % 3;
      this.imageBox.image(`${this.character}:${this.facing}_${this.step}`);
    }
  }

  // To handle non-user input movements.
  tick(dt, map) {
    let moved = false;
    let facing = '';

    if (this.missionMark) {
      this.missionMarkBox.show();
    } else {
      this.missionMarkBox.hide();
    }
    // For movement not caused by user input.
    if (this.targetX != this.x) {
      const sign = Math.sign(this.targetX - this.x);
      if (this.SPEED * dt > Math.abs(this.targetX - this.x)) {
        this.x = this.targetX;
      } else {
        this.x += sign * this.SPEED * dt;
      }
      moved = true;
      facing = sign > 0 ? 'RIGHT' : 'LEFT';
    }
    if (this.targetY != this.y) {
      const sign = Math.sign(this.targetY - this.y);
      if (this.SPEED * dt > Math.abs(this.targetY - this.y)) {
        this.y = this.targetY;
      } else {
        this.y += sign * this.SPEED * dt;
      }
      moved = true;
      facing = sign > 0 ? 'DOWN' : 'UP';
    }

    if (moved) {
      this.appendTo(map);
      this.facing = facing;
      this.step = Math.floor(Math.abs(this.x + this.y) / (this.WIDTH / 2)) % 3;
      this.imageBox.image(`${this.character}:${this.facing}_${this.step}`);
    } else if (this.step != 1) {
      this.step = 1;
      this.imageBox.image(`${this.character}:${this.facing}_${this.step}`);
    }
  }
}

export class CharDaemon {
  constructor() {
    this.chars = {};
  }

  create(id, row, col, texture, displayName) {
    if (id in this.chars) {
      console.error(`Character ID "${id}" is already declared:`);
      console.error(this.chars[id]);
      return;
    }
    const char = new Char(
        row * Const.TILE_SIZE, col * Const.TILE_SIZE, texture, displayName);

    this.chars[id] = char;
    return char;
  }

  getChar(id) {
    if (this.chars.hasOwnProperty(id)) {
      return this.chars[id];
    }
    return null;
  }
}


export class StoryLineDaemon {
  constructor(storyLine, dialogDaemon) {
    this.storyLine = storyLine;
    this.dialogDaemon = dialogDaemon;
  }

  init() {
    for (const missionId in this.storyLine) {
      if (!this.storyLine.hasOwnProperty(missionId)) continue;

      const mission = this.storyLine[missionId];
      // TODO: check dependency

      const key = mission.firstStep;
      const firstStep = mission.steps[key];

      const id = `${mission.id}/${firstStep.id}`;
      this.dialogDaemon.add(id, firstStep.npcId, firstStep.dialog);
    }

    // dialogDaemon.add('dialog-1', 'lady-of-lake', storyLine[0].steps['step-2'].dialog);
  }
}

export class DialogDaemon {
  constructor(charDaemon) {
    this.charDaemon = charDaemon;
    this.dialogs = {};
    this.hasOnGoingDialog = false;
  }

  getDialog(dialogId) {
    if (this.dialogs.hasOwnProperty(dialogId)) {
      return this.dialogs[dialogId];
    }
    return null;
  }

  showDialog(iterator) {
    const item = iterator.getCurrentDialogItem();
    if (!item) {
      return;
    }

    this.hasOnGoingDialog = true;
    const me = this.charDaemon.getChar('me');
    const talker = item.name.replace(/\$player/, me.name);

    if (item.line) {
      const content = item.line.replace(/\$player/, me.name);
      bootbox.alert({
        title: talker,
        message: content,
        callback: e => {
          this.hasOnGoingDialog = false;
          const next = iterator.nextDialogItem();
          if (next) {
            this.showDialog(iterator);
          } else {
            this.doneDialog(iterator);
          }
        }
      });
    } else if (item.question) {
      const question = item.question.replace(/\$player/, me.name);
      const inputOptions = [];

      for (const idx in item.choices) {
        const text = item.choices[idx].text;
        inputOptions.push({
          text: text.replace(/\$player/, me.name),
          value: idx,
        });
      }

      bootbox.prompt({
        title: talker,
        message: question,
        inputType: 'select',
        onEscape: false,
        backdrop: true,
        inputOptions: inputOptions,
        callback: result => {
          if (result === null) {
            return false;
          }
          this.hasOnGoingDialog = false;
          const next = iterator.nextDialogItem(result);
          if (next) {
            this.showDialog(iterator);
          } else {
            this.doneDialog(iterator);
          }
          return true;
        }
      });
    }
  }

  doneDialog(iterator) {
    const dialog = iterator.dialog;
    const missionStep = dialog.missionStep;
    const mission = missionStep.mission;

    this.remove(`${mission.id}/${missionStep.id}`);

    const nextStepKey = iterator.nextStep;
    if (!nextStepKey) {
      return;
    }

    console.log(nextStepKey);

    const nextStep = mission.steps[nextStepKey];
    if (!nextStep) return;
    this.add(`${mission.id}/${nextStep.id}`, nextStep.npcId, nextStep.dialog);
  }

  startDialog(dialogId) {
    if (this.hasOnGoingDialog) {
      console.warn(`There is an on-going dialog, cannot start a new one`);
      return;
    }

    const tuple = this.getDialog(dialogId);
    if (tuple === null) {
      console.error(`No such dialog: ${dialogId}`);
      return;
    }
    const {npcId, dialog} = tuple;
    const iterator = dialog.getIterator();
    this.showDialog(iterator);
  }

  findNearbyDialog(me) {
    for (const dialogId in this.dialogs) {
      if (!this.dialogs.hasOwnProperty(dialogId)) continue;

      const {npcId, dialog} = this.dialogs[dialogId];
      const npc = this.charDaemon.getChar(npcId);

      if (Math.hypot(npc.x - me.x, npc.y - me.y) < 2 * Const.TILE_SIZE) {
        return dialogId;
      }
    }
    return null;
  }

  add(dialogId, npcId, dialog) {
    if (this.getDialog(dialogId) !== null) {
      console.error(`Dialog ${dialogId} already exists.`);
      return;
    }

    const npc = this.charDaemon.getChar(npcId);
    if (null === npc) {
      console.error(`NPC ${npcId} doesn't exist.`);
      return;
    }

    npc.missionMark = true;

    this.dialogs[dialogId] = {
      npcId: npcId,
      dialog: dialog,
    };
    return this.dialogs[dialogId];
  }

  remove(dialogId) {
    const tuple = this.getDialog(dialogId);
    if (null === tuple) {
      return;
    }

    const {npcId, dialog} = tuple;
    const npc = this.charDaemon.getChar(npcId);
    if (npc !== null) {
      npc.missionMark = false;
    }

    delete this.dialogs[dialogId];
  }
}


















// We probably want to move "map" and moving function to another place.
// These functions is only used in 2d version.
class Hero {
  constructor(map, x, y, character, name) {
    this.map = map;
    if (Number.isNaN(x)) {
      x = 0;
    }
    if (Number.isNaN(y)) {
      y = 0;
    }
    this.target_x = this.x = x;
    this.target_y = this.y = y;
    this.audioLevel = 0;
    this.width = map.tsize;
    this.height = map.tsize;
    this.row = 0;
    this.col = 0;
    this.character = character;
    this.name = name;
    this.messages = [];

    this.loadImage();
  }

  // Pixels per second.
  // This is a little stupid...,
  // But static member variable is not standardized yet.
  get SPEED() {
    return 256; // Pixels per second
  }

  loadImage() {
    if (!this.character) return;
    const char = this.character;
    const img = Loader.getImage('hero:' + char);
    if (null !== img) {
      this.image = img;
    } else {
      Loader.loadImage(`hero:${char}`, `sprite/${char}.png`).then(
          () => {
            this.image = Loader.getImage('hero:' + char);
          },
      );
    }
  }

  getMessages(me, now) {
    return this.messages;
  }

  changeCharacter(character) {
    this.character = character;
    this.loadImage();
  }

  move(delta, dirX, dirY) {
    // move hero
    this.x += dirX * this.SPEED * delta;
    this.y += dirY * this.SPEED * delta;
    if (dirX || dirY) {
      this.col += this.SPEED * delta;
    }

    // check if we walked into a non-walkable tile
    this._collide(dirX, dirY);

    // clamp values
    const maxX = this.map.cols * this.map.tsize;
    const maxY = this.map.rows * this.map.tsize;
    this.x = Math.max(0, Math.min(this.x, maxX));
    this.y = Math.max(0, Math.min(this.y, maxY));
  }

  otherMove(delta) {
    let deltaX = 0;
    let deltaY = 0;
    let row = 0;
    if (this.target_x != this.x) {
      const dirX = (this.target_x > this.x) ? 1 : -1;
      row = (this.target_x > this.x) ? 2 : 1;
      deltaX = Math.min(
          this.SPEED * delta, Math.abs(this.target_x - this.x)) * dirX;
    } else if (this.target_y != this.y) {
      const dirY = (this.target_y > this.y) ? 1 : -1;
      deltaY = Math.min(
          this.SPEED * delta, Math.abs(this.target_y - this.y)) * dirY;
      row = (this.target_y > this.y) ? 0 : 3;
    }
    // move hero
    this.x += deltaX;
    this.y += deltaY;
    if (deltaX || deltaY) {
      this.row = row;
      this.col += Math.max(deltaX, deltaY);
    }
  }

  _collide(dirX, dirY) {
    let row;
    let col;
    // -1 in right and bottom is because image ranges from 0..63
    // and not up to 64
    const left = this.x - this.width / 2;
    const right = this.x + this.width / 2 - 1;
    const top = this.y - this.height / 2;
    const bottom = this.y + this.height / 2 - 1;

    // check for collisions on sprite sides
    const collision =
      this.map.isSolidTileAtXY(left, top) ||
      this.map.isSolidTileAtXY(right, top) ||
      this.map.isSolidTileAtXY(right, bottom) ||
      this.map.isSolidTileAtXY(left, bottom);
    if (!collision) {
      return;
    }

    if (dirY > 0) {
      row = this.map.getRow(bottom);
      this.y = -this.height / 2 + this.map.getY(row);
    } else if (dirY < 0) {
      row = this.map.getRow(top);
      this.y = this.height / 2 + this.map.getY(row + 1);
    } else if (dirX > 0) {
      col = this.map.getCol(right);
      this.x = -this.width / 2 + this.map.getX(col);
    } else if (dirX < 0) {
      col = this.map.getCol(left);
      this.x = this.width / 2 + this.map.getX(col + 1);
    }
  }
}
