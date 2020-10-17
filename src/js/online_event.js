import * as PhaserWrapper from './phaser_wrapper.js';
import * as JitsiChannel from './jitsi_channel.js';
import * as DataStore from './data_store.js';

export const connection = new JitsiChannel.JitsiConnection();

function initJitsi() {
  connection.init();
}

PhaserWrapper.CreateGame('maps/idystopia.json', 'online_event.json', connection);

initJitsi();

DataStore.AnswerStore.listen('player_name', () => {
  connection.setDisplayName(DataStore.AnswerStore.get('player_name'));
});
