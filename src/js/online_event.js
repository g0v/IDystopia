import * as PhaserWrapper from './phaser_wrapper.js';
import * as JitsiChannel from './jitsi_channel.js';
import * as DataStore from './data_store.js';

export const connection = new JitsiChannel.JitsiConnection();
window.connection = connection;

function initJitsi() {
  connection.init();
}

PhaserWrapper.CreateGame({
  tilemapTiledJSON: 'maps/idystopia.json',
  storylineJSON: 'online_event.json',
  connection});

initJitsi();

DataStore.AnswerStore.listen('player_name', () => {
  connection.setDisplayName(DataStore.AnswerStore.get('player_name'));
});

$( '#control-panel' ).draggable({
  create: function() {
    $(this).css({
      top: $(this).position().top,
      left: $(this).position().left,
      bottom: "auto",
      right: "auto",
    });
  }
}).click(() => {
  const select = document.getElementById('emoji-select');
  connection.sendMessage(select.value);
});
