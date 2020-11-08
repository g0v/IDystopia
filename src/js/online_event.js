import * as PhaserWrapper from './phaser_wrapper.js';
import * as JitsiChannel from './jitsi_channel.js';
import * as DataStore from './data_store.js';

export const connection = new JitsiChannel.JitsiConnection();
window.connection = connection;  // for debugging

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
    // Because "draggable" only changes "top" and "left" when widget is dragged.
    // We have to make sure "bottom" and "right" are set to "auto", so the size
    // of widget won't change when widget is dragged.
    $(this).css({
      top: $(this).position().top,
      left: $(this).position().left,
      bottom: "auto",
      right: "auto",
    });
  }
});

$( '#emoji-send' ).click(() => {
  const select = document.getElementById('emoji-select');
  connection.sendMessage(select.value);
});
