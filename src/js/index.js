import * as PhaserWrapper from './phaser_wrapper.js';

const npcList = {
  'convenient-store-npc': {
    name: '便利商店店員',
    x: 800 + 128,
    y: 800 - 128,
    texture: 'atlas',
    frame: 'misa-left',
  },
  'classmate-npc': {
    name: '同學',
    x: 600,
    y: 550,
    texture: 'atlas',
    frame: 'misa-left',
  },
  'academic-affairs-officer-npc': {
    name: '教務處職員',
    x: 700,
    y: 550,
    texture: 'atlas',
    frame: 'misa-left',
  },
  'department-officer-npc': {
    name: '系辦公室職員',
    x: 800,
    y: 550,
    texture: 'atlas',
    frame: 'misa-right',
  },
  'home-robot-npc': {
    name: '家用機器人',
    x: 400,
    y: 550,
    texture: 'atlas',
    frame: 'misa-right'
  }
};

PhaserWrapper.CreateGame({
  tilemapTiledJSON: 'maps/idystopia.json',
  storylineJSON: 'regular.json',
  npcList});
