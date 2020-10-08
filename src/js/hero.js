/* global bootbox */

import * as Const from './const.js';
import * as StoryLine from './story_line.js';
import * as DataStore from './data_store.js';

export class Char {
  constructor(phaser, id, name, x, y, texture, frame) {
    this.phaser = phaser;
    if (Number.isNaN(x)) x = 0;
    if (Number.isNaN(y)) y = 0;
    this.id = id;
    this.x = x;
    this.y = y;
    this._name = name;
    this.texture = texture;
    this.frame = frame;
    this.facing = 'DOWN';
    this.missionMark = null;

    this.makeContainer();
  }

  makeContainer() {
    // Create a sprite with physics enabled via the physics system. The image
    // used for the sprite has a bit of whitespace, so I'm using setSize &
    // setOffset to control the size of the player's body.
    this.player = this.phaser.physics.add.sprite(
      this.x, this.y, this.texture, this.frame).setSize(32, 40).setOffset(0, 24);

    this.text = this.phaser.add.text(this.x, this.y, this.name, {
      font: '18px monospace',
      fill: '#fff',
      align: 'center',
    }).setOrigin(0.5).setStroke('#000', 3).setDepth(30);
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

  get name() {
    return this._name;
  }

  set name(newName) {
    this._name = newName;
    this.text.setText(this.name);
  }

  showMissionMark(enable) {
    if (enable) {
      if (this.missionMark) return;

      this.missionMark = this.phaser.add.text(
        this.player.x, this.player.y - 16,
        '!',
        {
          font: '24px monospace',
          fill: '#000',
          align: 'center',
        }
      ).setOrigin(0.5).setStroke('#fff', 3);
    } else {
      this.missionMark.destroy();
      this.missionMark = null;
    }
  }

  update() {
    // this is stupid, but I can't find a better way.
    this.text.setX(this.player.x);
    this.text.setY(this.player.y + 45);
  }
}

export class CharDaemon {
  constructor(phaser) {
    this.phaser = phaser;
    this.chars = {};
  }

  create(id, name, x, y, texture, frame) {
    if (id in this.chars) {
      console.error(`Character ID "${id}" is already declared:`);
      console.error(this.chars[id]);
      return;
    }
    const char = new Char(
      this.phaser,
      id, name, x, y, texture, frame);

    this.chars[id] = char;
    return char;
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
  constructor(storyLine, dialogDaemon) {
    this.storyLine = storyLine;
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

  init() {
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
      this.dialogDaemon.add(id, firstStep.npcId, firstStep.dialog);

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

  showDialog(iterator) {
    const item = iterator.getCurrentDialogItem();
    if (!item) {
      this.doneDialog(iterator);
      return;
    }

    this.hasOnGoingDialog = true;
    const me = this.charDaemon.getChar('player');
    const talker = item.name.replace(_RE_PLAYER, me.name);

    if (item instanceof StoryLine.DialogItemLine) {
      const content = item.line.replace(_RE_PLAYER, me.name);
      bootbox.alert({
        title: talker,
        message: content,
        callback: () => {
          this.hasOnGoingDialog = false;
          const next = iterator.nextDialogItem();
          if (next) {
            this.showDialog(iterator);
          } else {
            this.doneDialog(iterator);
          }
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
    } else if (item instanceof StoryLine.DialogItemPrompt) {
      const question = item.question.replace(_RE_PLAYER, me.name);
      bootbox.prompt({
        title: talker,
        message: question,
        inputType: 'text',
        onEscape: false,
        backdrop: true,
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
    } else if (item instanceof StoryLine.DialogItemMessage) {
      const message = item.message.replace(_RE_PLAYER, me.name);
      bootbox.alert({
        title: "",
        message: message,
        callback: () => {
          this.hasOnGoingDialog = false;
          const next = iterator.nextDialogItem();
          if (next) {
            this.showDialog(iterator);
          } else {
            this.doneDialog(iterator);
          }
        }
      });
    }
  }

  doneDialog(iterator) {
    const dialog = iterator.dialog;
    const missionStep = dialog.missionStep;
    const mission = missionStep.mission;

    this.remove(`${mission.id}/${missionStep.id}`);
    DataStore.AnswerStore.setAndNotify(`${mission.id}/${missionStep.id}/done`, "true");

    const nextStepKey = iterator.nextStep;
    if (!nextStepKey) {
      return;
    }

    console.log(nextStepKey);

    const nextStep = mission.steps[nextStepKey];
    if (!nextStep) return;
    this.add(`${mission.id}/${nextStep.id}`, nextStep.npcId, nextStep.dialog);
  }

  moveTo(where) {
    const player = this.charDaemon.getChar('player');
    console.log(player);
    switch (where) {
      case 'SCHOOL':
        player.player.x = 500;
        player.player.y = 500;
        break;
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

    if (dialog.missionStep.moveTo) {
      this.moveTo(dialog.missionStep.moveTo);
    }

    const iterator = dialog.getIterator();
    this.showDialog(iterator);
  }

  checkDialogToTrigger() {
    if (this.hasOnGoingDialog) return null;

    for (const idx in this.dialogToTrigger) {
      const {dialogId} = this.dialogToTrigger[idx];
      this.dialogToTrigger.shift();
      return dialogId;
    }

    return null;
  }

  findNearbyDialog(me) {
    for (const dialogId in this.dialogs) {
      const {npcId} = this.dialogs[dialogId];
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

    if (npcId === undefined) {
      // trigger this in next frame
      this.dialogToTrigger.push({
        dialogId,
        dialog,
      });
    } else {
      const npc = this.charDaemon.getChar(npcId);
      if (null === npc) {
        console.error(`NPC ${npcId} doesn't exist.`);
        return;
      }
      // npc.missionMark = true;
      npc.showMissionMark(true);
    }

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

    const {npcId} = tuple;
    const npc = this.charDaemon.getChar(npcId);
    if (npc !== null) {
      // npc.missionMark = false;
      npc.showMissionMark(false);
    }

    delete this.dialogs[dialogId];
  }
}
