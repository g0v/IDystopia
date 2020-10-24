import * as PhaserWrapper from './phaser_wrapper.js';
import * as Hero from './hero.js';

const npcList = {
  'speaker-npc': {
    name: '演講者',
    texture: 'atlas',
    frame: 'misa-down',
  },
  'shop-clerk-npc': {
    name: '店員',
    texture: 'atlas',
    frame: 'misa-down',
  },
  'classmate-npc': {
    name: '同學',
    texture: 'atlas',
    frame: 'misa-left',
  },
  'academic-affairs-officer-npc': {
    name: '教務處職員',
    texture: 'atlas',
    frame: 'misa-left',
  },
  'department-officer-npc': {
    name: '系辦公室職員',
    texture: 'atlas',
    frame: 'misa-right',
  },
  'home-robot-npc': {
    name: '家用機器人',
    texture: 'atlas',
    frame: 'misa-right'
  }
};
PhaserWrapper.CreateGame({
  tilemapTiledJSON: 'maps/idystopia.json',
  storylineJSON: 'regular.json',
  npcList});

$( '#mission-panel' ).click( () => {
  Hero.dialogDaemon.showHint();
});
