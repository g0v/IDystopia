import * as Const from './const.js';
import * as StoryLine from './story_line.js';
import * as DataStore from './data_store.js';
import * as PhaserWrapper from './phaser_wrapper.js';

export class Char {
  constructor(scene, id, name, x, y, texture, frame) {
    this.scene = scene;
    if (Number.isNaN(x)) x = 0;
    if (Number.isNaN(y)) y = 0;
    this.id = id;
    this.x = x;
    this.y = y;
    this._name = name;
    this.texture = texture;
    this.frame = frame;
    this.messages = [];
    this.messageBox = null;

    this.makeContainer();
  }

  makeContainer() {
    // Create a sprite with physics enabled via the physics system. The image
    // used for the sprite has a bit of whitespace, so I'm using setSize &
    // setOffset to control the size of the player's body.
    this.player = this.scene.physics.add.sprite(
      this.x, this.y, this.texture, this.frame)
      .setSize(32, 40)
      .setOffset(0, 24);

    this.player.setDepth(2);

    this.text = this.scene.add.text(this.x, this.y, this.name, {
      font: '18px monospace',
      fill: '#fff',
      align: 'center',
    }).setOrigin(0.5).setStroke('#000', 3).setDepth(1);
  }

  get WIDTH() {
    return 32;
  }

  get HEIGHT() {
    return 32;
  }

  get name() {
    return this._name;
  }

  set name(newName) {
    this._name = newName;
    this.text.setText(this.name);
  }

  addMessage(message, expireTime) {
    if (expireTime === undefined) expireTime = Infinity;
    this.messages.push({message, expireTime});
  }

  clearMessage() {
    this.messages = [];
  }

  showMissionMark(enable) {
    if (enable) {
      this.addMessage('!');
    } else {
      this.clearMessage();
    }
  }

  _removeOutdatedMessage() {
    const now = (new Date()).getTime();
    let end = 0;
    for (const i in this.messages) {
      if (this.messages[i].expireTime > now) {
        this.messages[end] = this.messages[i];
        end++;
      }
    }
    this.messages = this.messages.slice(0, end);
  }

  update(time, delta) {
    // this is stupid, but I can't find a better way.
    this.text.setX(this.player.x);
    this.text.setY(this.player.y + 45);

    if (this.messages.length > 0) {
      this._removeOutdatedMessage();
    }

    if (this.messages.length > 0) {
      if (!this.messageBox) {
        this.messageBox = this.scene.add.text(
          this.player.x, this.player.y - 16,
          '',
          {
            font: '24px monospace',
            fill: '#000',
            align: 'center',
            backgroundColor: 'white',
          }
        ).setOrigin(0.5, 1).setDepth(99);
      }
      let jointMessage = '';
      for (const i in this.messages) {
        jointMessage += this.messages[i].message + '\n';
      }
      this.messageBox.setText(jointMessage.slice(0, -1));
      this.messageBox.setVisible(true);
    } else {
      if (this.messageBox) this.messageBox.setVisible(false);
    }

    if (this.messageBox) {
      this.messageBox.setX(this.player.x);
      this.messageBox.setY(this.player.y - 16);
    }
  }

  destroy() {
    this.player.destroy();
    this.text.destroy();
  }
}

export class MovingNPC extends Char {
  constructor(scene, id, name, x, y, texture, frame, movements) {
    super(scene, id, name, x, y, texture, frame);

    this.points = [];
    this.points.push({x: x, y: y});

    for (const {dx, dy} of movements) {
      const px = this.points[this.points.length - 1].x;
      const py = this.points[this.points.length - 1].y;
      this.points.push({x: px + dx, y: py + dy});
    }

    if (this.points.length > 1) {
      this.nextPoint = 1;
    }
  }

  update(time, delta) {
    const px = this.points[this.nextPoint].x;
    const py = this.points[this.nextPoint].y;
    const dest = Math.hypot(px - this.player.x, py - this.player.y);
    const minGap = Math.max(Const.TILE_SIZE * 0.1, Const.SPEED * delta / 1000);

    if (dest < minGap) {
      this.player.setVelocity(0);
      this.player.setX(px);
      this.player.setY(py);

      this.nextPoint = (this.nextPoint + 1) % this.points.length;
    } else {
      this.player.setVelocityX(px - this.x);
      this.player.setVelocityY(py - this.y);
      this.player.body.velocity.normalize().scale(Const.SPEED);
    }
    this.x = this.player.x;
    this.y = this.player.y;

    super.update(time, delta);
  }
}

export class RemotePlayer extends Char {

  constructor(scene, id, name, x, y, texture, frame) {
    super(scene, id, name, x, y, texture, frame);

    this.dest = {};
  }

  setProperty(key, value) {
    switch (key) {
      case 'texture':
        this.texture = value;
        this.player.setTexture(value);
        break;
      case 'frame':
        this.frame = value;
        this.player.setFrame(value);
        break;
      case 'name':
        this.name = value;
        break;
      case 'x':
        if (this.x !== value) this.dest.x = value;
        break;
      case 'y':
        if (this.y !== value) this.dest.y = value;
        break;
    }
  }

  update(time, delta) {
    // delta ~= 16 (ms), roughly 60 FPS
    super.update(time, delta);

    // set it higher than local speed, since we need to catch up.
    const speed = Const.SPEED * 1.2;
    const dest = Math.hypot(
      this.player.x - this.dest.x, this.player.y - this.dest.y);
    const minGap = Math.max(Const.TILE_SIZE * 0.1, speed * 0.05);

    this.player.setVelocity(0);
    if (dest < Const.TILE_SIZE * 5 && dest > minGap) {
      this.player.setVelocityX((this.dest.x - this.x) * 2);
      this.player.setVelocityY((this.dest.y - this.y) * 2);
    } else {
      this.player.setX(this.dest.x);
      this.player.setY(this.dest.y);
    }
    this.x = this.player.x;
    this.y = this.player.y;
  }
}

export class CharDaemon {
  constructor() {
    this.scene = null;
    this.chars = {};
  }

  setScene(scene) {
    this.scene = scene;
  }

  create(id, name, x, y, texture, frame) {
    if (id in this.chars) {
      console.error(`Character ID "${id}" is already declared:`);
      console.error(this.chars[id]);
      return;
    }
    const char = new Char(
      this.scene,
      id, name, x, y, texture, frame);

    this.chars[id] = char;
    return char;
  }

  createMovingNPC(id, name, x, y, texture, frame, movements) {
    if (id in this.chars) {
      console.error(`Character ID "${id}" is already declared:`);
      console.error(this.chars[id]);
      return;
    }

    const char = new MovingNPC(
      this.scene,
      id, name, x, y, texture, frame, movements);

    this.chars[id] = char;
    return char;
  }

  createRemotePlayer(id, name, x, y, texture, frame) {
    if (id in this.chars) {
      console.error(`Character ID "${id}" is already declared:`);
      console.error(this.chars[id]);
      return;
    }

    const char = new RemotePlayer(
      this.scene,
      id, name, x, y, texture, frame);

    this.chars[id] = char;
    return char;
  }

  deleteChar(id) {
    if (id in this.chars) {
      this.chars[id].destroy();
      delete this.chars[id];
    }
  }

  getChar(id) {
    if (id in this.chars) {
      return this.chars[id];
    }
    return null;
  }

  update(time, delta) {
    for (const id in this.chars) {
      const char = this.chars[id];
      char.update(time, delta);
    }
  }
}


export class StoryLineDaemon {
  constructor(dialogDaemon) {
    this.storyLine = null;
    this.dialogDaemon = dialogDaemon;
    this.missionWithDependencies = {};

    DataStore.AnswerStore.listen('*', () => {
      console.log(this);
      for (const missionId in this.missionWithDependencies) {
        const mission = this.storyLine[missionId];
        if (!mission.isReady()) {
          continue;
        }
        delete this.missionWithDependencies[missionId];

        this._addToDialogDaemon(mission);
      }
    });
  }

  init(storyLine) {
    this.storyLine = storyLine;
    for (const missionId in this.storyLine) {
      const mission = this.storyLine[missionId];

      if (!mission.isReady()) {
        this.missionWithDependencies[missionId] = mission;
        continue;
      }

      this._addToDialogDaemon(mission);
    }
    console.log('not enabled missions: ', this.missionWithDependencies);
  }

  _addToDialogDaemon(mission) {
      const key = mission.firstStep;
      const firstStep = mission.steps[key];

      const id = `${mission.id}/${firstStep.id}`;
      this.dialogDaemon.add(id, firstStep);
  }
}

const _RE_PLAYER = /\$player/;

export class DialogDaemon {
  constructor(charDaemon) {
    this.charDaemon = charDaemon;
    this.dialogs = {};
    this.hasOnGoingDialog = false;
    this.dialogToTrigger = [];
  }

  get scene() {
    return this.charDaemon.scene;
  }

  showHint() {
    let message = '';
    for (const key in this.dialogs) {
      const dialog = this.dialogs[key];
      console.log(dialog);
      message += `<h3>${dialog.dialog.missionStep.title}</h3>`;
      message += `<p>${dialog.dialog.missionStep.description}</p>`;
    }
    if (!message) {
      message = '沒有任務!';
    }
    bootbox.alert({
      title: '任務列表',
      message: message,
    });
  }

  getDialog(dialogId) {
    if (dialogId in this.dialogs) {
      return this.dialogs[dialogId];
    }
    return null;
  }

  showNextDialog(iterator, result = undefined) {
    this.hasOnGoingDialog = false;
    const next = iterator.nextDialogItem(result);
    if (next) {
      this.showDialog(iterator);
    } else {
      this.doneDialog(iterator);
    }
  }

  showDialog(iterator) {
    const item = iterator.getCurrentDialogItem();
    if (!item) {
      this.doneDialog(iterator);
      return;
    }

    this.hasOnGoingDialog = true;
    const me = this.charDaemon.getChar('player');
    const talker = item.name.replace(_RE_PLAYER, me.name);

    console.log('iterator: ', iterator);
    if (item instanceof StoryLine.DialogItemLine) {
      const content = item.line.replace(_RE_PLAYER, me.name);
      bootbox.alert({
        title: talker,
        message: content,
        callback: () => {
          this.showNextDialog(iterator);
        }
      });
    } else if (item instanceof StoryLine.DialogItemSelect) {
      const question = item.question.replace(_RE_PLAYER, me.name);
      const inputOptions = [];

      for (const idx in item.choices) {
        const text = item.choices[idx].text;
        inputOptions.push({
          text: text.replace(_RE_PLAYER, me.name),
          value: idx,
        });
      }

      const box = bootbox.prompt({
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
          this.showNextDialog(iterator, result);
          return true;
        }
      });
      box.keypress(e => {
        if (e.keyCode === 13) {
          $('button.bootbox-accept').click();
        }
      });
    } else if (item instanceof StoryLine.DialogItemPrompt) {
      const question = item.question.replace(_RE_PLAYER, me.name);
      bootbox.prompt({
        title: talker,
        message: question,
        inputType: 'text',
        onEscape: false,
        backdrop: true,
        callback: result => {
          if (!result) {
            return false;
          }
          this.showNextDialog(iterator, result);
          return true;
        }
      });
    } else if (item instanceof StoryLine.DialogItemMessage) {
      const message = item.message.replace(_RE_PLAYER, me.name);
      bootbox.alert({
        title: "",
        message: message,
        callback: () => {
          this.showNextDialog(iterator);
        }
      });
    } else if (item instanceof StoryLine.DialogItemIframe) {
      const style = item.style || "";
      const message = `
      <iframe
        id='dialog-iframe'
        class="dialog-iframe"
        src="${item.url}"
        style="${style}" ></iframe>`;
      bootbox.dialog({
        message,
        size: 'large',
        centerVertical: true,
        closeButton: true,
        // callback: this won't be called in "dialog"
        onShown: () => {
          const iframe = document.getElementById('dialog-iframe');
          console.log(iframe);
        },
        onHidden: () => {
          // this function is called when user press "x" to close the dialog.
          console.log('on hidden');
        }
      });
      // We can use iframe.contentWindow.postMessage()" to send a message to
      // iframe.  And use window.addEventListener('message', e => { ... }) to
      // receive the event.  (and vice versa)
    }
  }

  recordDone(recordKey) {
    DataStore.AnswerStore.setAndNotify(recordKey, "true");
    DataStore.RemoteStore.increase(`MISSION/${recordKey}`);
  }

  doneDialog(iterator) {
    this.hasOnGoingDialog = false;
    const dialog = iterator.dialog;
    const missionStep = dialog.missionStep;
    const mission = missionStep.mission;

    this.remove(`${mission.id}/${missionStep.id}`);
    this.recordDone(`${mission.id}/${missionStep.id}/done`);

    const nextStepKey = iterator.nextStep;
    if (!nextStepKey) {
      return;
    }

    console.log('nextStepKey: ', nextStepKey);

    const nextStep = mission.steps[nextStepKey];
    if (!nextStep) return;
    this.add(`${mission.id}/${nextStep.id}`, nextStep);
  }

  moveTo(where, callback) {
    const me = this.charDaemon.getChar('player');
    if (where in PhaserWrapper.mapObjects) {
      const loc = PhaserWrapper.mapObjects[where];
      const camera = this.scene.cameras.main;
      // in milliseconds
      camera.fadeOut(750, 0, 0, 0, (_, progressFadeOut) => {
        if (progressFadeOut < 1) return;
        me.player.x = loc.x;
        me.player.y = loc.y;
        camera.fadeIn(750, 0, 0, 0, (_, progressFadeIn) => {
          if (progressFadeIn < 1) return;
          callback();
        });
      });
    } else {
      callback();
    }
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

    console.info(`startDialog: ${dialogId}`, tuple.dialog);
    const {dialog} = tuple;
    this.hasOnGoingDialog = true;

    if (dialog.missionStep.moveTo) {
      this.moveTo(dialog.missionStep.moveTo, () => {
        const iterator = dialog.getIterator();
        this.showDialog(iterator);
      });
    } else {
      const iterator = dialog.getIterator();
      this.showDialog(iterator);
    }
  }

  checkDialogToTrigger(me) {
    if (this.hasOnGoingDialog) return null;

    for (const idx in this.dialogToTrigger) {
      const {dialogId} = this.dialogToTrigger[idx];
      this.dialogToTrigger.shift();
      return dialogId;
    }

    for (const dialogId in this.dialogs) {
      const {locationId} = this.dialogs[dialogId];
      if (locationId && (locationId in PhaserWrapper.mapObjects)) {
        const loc = PhaserWrapper.mapObjects[locationId];
        if (Math.hypot(loc.x - me.x, loc.y - me.y) < 2 * Const.TILE_SIZE) {
          console.log('Will trigger dialog', dialogId, 'because of location');
          return dialogId;
        }
      }
    }

    return null;
  }

  findNearbyDialog(me) {
    for (const dialogId in this.dialogs) {
      const {npcId} = this.dialogs[dialogId];
      if (npcId) {
        const npc = this.charDaemon.getChar(npcId);

        if (Math.hypot(npc.x - me.x, npc.y - me.y) < 2 * Const.TILE_SIZE) {
          return dialogId;
        }
      }
    }
    return null;
  }

  add(dialogId, step) {
    const dialog = step.dialog;
    const npcId = step.npcId;
    const locationId = step.locationId;

    console.log(`dialogId: ${dialogId}, npcId: ${npcId}, loc: ${locationId}`);

    if (this.getDialog(dialogId) !== null) {
      console.error(`Dialog ${dialogId} already exists.`);
      return;
    }

    if (step.npcId !== undefined) {
      const npc = this.charDaemon.getChar(npcId);
      if (null === npc) {
        console.error(`NPC ${npcId} doesn't exist.`);
        return;
      }
      npc.showMissionMark(true);
    } else if (step.locationId !== undefined) {
      if (!(locationId in PhaserWrapper.mapObjects)) {
        console.error(`Location ${locationId} doesn't exist.`);
        return;
      }
    } else {
      console.warn(`adding ${dialogId} to dialogToTrigger`);
      // trigger this in next frame
      this.dialogToTrigger.push({
        dialogId,
        dialog,
      });
    }

    this.dialogs[dialogId] = {
      npcId: npcId,
      locationId: locationId,
      dialog: dialog,
    };
    return this.dialogs[dialogId];
  }

  remove(dialogId) {
    const tuple = this.getDialog(dialogId);
    if (null === tuple) {
      return;
    }

    const {npcId} = tuple;
    const npc = this.charDaemon.getChar(npcId);
    if (npc !== null) {
      npc.showMissionMark(false);
    }

    delete this.dialogs[dialogId];
  }
}

export const charDaemon = new CharDaemon();
export const dialogDaemon = new DialogDaemon(charDaemon);
export const storyLineDaemon = new StoryLineDaemon(dialogDaemon);

window.charDaemon = charDaemon;
