import * as PhaserWrapper from './phaser_wrapper.js';
import * as Hero from './hero.js';

const npcList = {
  'speaker-npc': {
    name: '演講者',
    texture: 'atlas',
    frame: 'misa-front',
  },
  'shop-clerk-npc': {
    name: '店員',
    texture: 'atlas',
    frame: 'misa-front',
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
    movements: [
      {
        dx: 175,
        dy: 175,
      },
    ]
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
  },
  'doctor-npc': {
    name: '醫生',
    texture: 'atlas',
    frame: 'misa-right'
  },
  'nurse-npc': {
    name: '護士',
    texture: 'atlas',
    frame: 'misa-right'
  },
  'doctor-npc': {
    name: '機器人',
    texture: 'atlas',
    frame: 'misa-right'
  },
  'doctor-npc-1': {
    name: '機器人',
    texture: 'atlas',
    frame: 'misa-right'
  },
};

const game = PhaserWrapper.CreateGame({
  tilemapTiledJSON: 'maps/idystopia.json',
  storylineJSON: 'This-biography.json',
  npcList,
  isCLabEnv: true,
});

window.game = game;

$( '#button-sound' ).click(() => {
  const soundButton = $('#button-sound');
  let newMute = !game.sound.mute;
  game.sound.setMute(newMute);
  // Move focus to other place, so next ENTER won't toggle mute state again.
  soundButton.blur();

  if (newMute) {
    soundButton.text('🔇');
  } else {
    soundButton.text('🔊');
  }
});
$( '#button-show-mission' ).click( () => {
  Hero.dialogDaemon.showHint();
});
