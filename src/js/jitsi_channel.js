import * as Hero from './hero.js';

const INIT_OPTIONS = {
  disableAudioLevels: false,

  // The ID of the jidesha extension for Chrome.
  desktopSharingChromeExtId: 'mbocklcggfhnbahlnepmldehdhpjfcjp',

  // Whether desktop sharing should be disabled on Chrome.
  desktopSharingChromeDisabled: false,

  // The media sources to use when using screen sharing with the Chrome
  // extension.
  desktopSharingChromeSources: ['screen', 'window'],

  // Required version of Chrome extension
  desktopSharingChromeMinExtVersion: '0.1',

  // Whether desktop sharing should be disabled on Firefox.
  desktopSharingFirefoxDisabled: true,
};

const initJitsiMeetJs = (
  function() {
    JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
    let INITIALIZED = false;
    return () => {
      if (INITIALIZED) return;
      JitsiMeetJS.init(INIT_OPTIONS);
      INITIALIZED = true;
    };
  }
)();

const TYPE_PLAYER_PROPERTY = 'eid-player-property';

/**
 * A class to handle Jitsi connection of a room.
 */
export class JitsiConnection {
  constructor() {
    this.connection = null;
    this.room = null;
    this._lastSetLocalProperty = 0;
    this._lastBroadcastLocalProperty = 0;
    this._sentLocalProperty = {};
  }

  init() {
    initJitsiMeetJs();

    if (this.conenction) {
      // TODO(stimim): check if connection is still alive.
      return;
    }

    const options = {
      hosts: {
        domain: 'jitsi.jothon.online',
        muc: 'conference.jitsi.jothon.online',
        focus: 'focus.jitsi.jothon.online',
      },
      externalConnectUrl: 'https://jitsi.jothon.online/http-pre-bind',
      bosh: 'https://jitsi.jothon.online/http-bind?room=eid',
      websocket: 'wss://jitsi.jothon.online/xmpp-websocket',

      // The name of client node advertised in XEP-0115 'c' stanza
      clientNode: 'http://jitsi.org/jitsimeet',
    };

    this.connection = new JitsiMeetJS.JitsiConnection(null, null, options);

    // TODO(stimim): why???
    const onDisconnected = () => {
      this.connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
        () => this.onConnectionSuccess());
      this.connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_FAILED,
        () => this.onConnectionFailed());
      this.connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
        onDisconnected);
    };

    this.connection.addEventListener(
      JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
      () => this.onConnectionSuccess());
    this.connection.addEventListener(
      JitsiMeetJS.events.connection.CONNECTION_FAILED,
      () => this.onConnectionFailed());
    this.connection.addEventListener(
        JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
        onDisconnected);

    this.connection.connect();
  }

  disconnect() {
    if (this.connection) {
      this.connection.disconnect();
      this.connection = null;
    }
  }

  onConnectionSuccess() {
    this._initConferenceRoom();
  }

  onConnectionFailed() {
    console.log('Failed to connect to Jitsi...')
  }

  _initConferenceRoom() {
    // const roomId = 'idystopia_online';
    const roomId = 'eid';
    console.log('roomId: ', roomId);
    if (this.room) {
      return this.room;
    }
    const confOptions = {
      openBridgeChannel: 'websocket',
      confID: `jitsi.jothon.online/${roomId}`,
    };

    this.room = this.connection.initJitsiConference(roomId, confOptions);

    this.room.setDisplayName('???');
    this.room.on(
      JitsiMeetJS.events.conference.CONFERENCE_JOINED,
      () => { this.onConferenceJoined(); });

    this.room.join();

    return this.room;
  }

  setLocalParticipantProperty(properties) {
    const now = (new Date()).getTime();
    const minDelta = 60 * 1000;  // milliseconds
    if (now - this._lastSetLocalProperty <= minDelta) {
      return;
    }
    console.info('call setLocalParticipantProperty', properties);
    this._lastSetLocalProperty = now;
    if (this.room) {
      for (const key in properties) {
        if ((key in this._sentLocalProperty) &&
            this._sentLocalProperty[key] === properties[key]) {
          continue;
        }
        this.room.setLocalParticipantProperty(key, properties[key]);
        this._sentLocalProperty[key] = properties[key];
      }
    }
  }

  setDisplayName(name) {
    if (this.room) {
      this.room.setDisplayName(name);
    }
  }

  /**
   * One connection can only join one room at a time.
   * Keeping the lifecycle of connection and room the same should be easier.
   */
  disconnect() {
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
    if (this.connection) {
      this.connection.disconnect();
      this.connection = null;
    }
  }

  loadParticipants() {
    if (!this.room || !this.connection) return;

    const participants = this.room.participants;

    for (const id in participants) {
      const user = participants[id];

      console.log('load user: ', id, user);

      const char = Hero.charDaemon.getChar(id);
      if (char) {
        console.log(`user ${id} already created, skip`);
        continue;
      }

      Hero.charDaemon.createRemotePlayer(
        id,
        user.getDisplayName(),
        Number(user.getProperty('left')),
        Number(user.getProperty('top')),
        user.getProperty('texture'),
        user.getProperty('frame'),
      );
    }

    for (const id in Hero.charDaemon.chars) {
      const char = Hero.charDaemon.chars[id];
      if (char instanceof Hero.RemotePlayer) {
        if (!(id in participants)) {
          delete Hero.charDaemon.chars[id];
        }
      }
    }
  }

  onConferenceJoined() {
    //gameCore.registerOnMemberListChanged(renderMemberList);

    this.loadParticipants();

    this.room.on(
      JitsiMeetJS.events.conference.USER_JOINED,
      (id, user) => {
        // Normally, at this point, we won't be able to get properties.
        // We will get property update very soon in the
        // "PARTICIPANT_PROPERTY_CHANGED" event later.
        console.log(`user joined`, user);
        Hero.charDaemon.createRemotePlayer(
          id,
          user.getDisplayName(),
          0, 0,
          user.getProperty('texture'),
          user.getProperty('frame')
        );
      });

    this.room.on(
      JitsiMeetJS.events.conference.MESSAGE_RECEIVED,
      (id, text, timestamp) => {
        console.log('message received: ', {id, text, timestamp});
        if (timestamp === undefined) {
          timestamp = (new Date()).getTime();
        } else if (typeof(timestamp) === 'string' ||
                   timestamp instanceof String) {
          timestamp = (new Date(timestamp)).getTime();
        }
        let char;
        if (id === this.room.myUserId()) {
          char = Hero.charDaemon.getChar('player');
        } else {
          char = Hero.charDaemon.getChar(id);
        }
        if (char) char.addMessage(text, timestamp + 60 * 1000);
      });

    this.room.on(
      JitsiMeetJS.events.conference.USER_LEFT,
      (id, /* user */) => {
        Hero.charDaemon.deleteChar(id);
      });

    this.room.on(
      JitsiMeetJS.events.conference.PARTICIPANT_PROPERTY_CHANGED,
      (user, key) => {
        const id = user.getId();
        const char = Hero.charDaemon.getChar(id);
        if (!char) {
          return;
        }
        if (!this.room || !this.connection) return;
        const x = parseInt(user.getProperty('left'));
        const y = parseInt(user.getProperty('top'));
        if (!Number.isNaN(x) && !Number.isNaN(y)) {
          char.setProperty('x', x);
          char.setProperty('y', y);
        }

        const texture = user.getProperty('texture');
        const frame = user.getProperty('frame');
        if (texture && frame &&
            (frame !== char.frame || texture !== char.texture)) {
          char.setProperty('texture', texture);
          char.setProperty('frame', frame);
        }
      });

    this.room.on(
      JitsiMeetJS.events.conference.ENDPOINT_MESSAGE_RECEIVED,
      (participant, payload) => {
        if (payload.type === TYPE_PLAYER_PROPERTY) {
          const property = payload.property;
          const id = participant.getId();
          const char = Hero.charDaemon.getChar(id);
          if (!char) {
            return;
          }
          const x = Number(property.left);
          const y = Number(property.top);
          if (!Number.isNaN(x) && !Number.isNaN(y)) {
            char.setProperty('x', x);
            char.setProperty('y', y);
          }

          const texture = property.texture;
          const frame = property.frame;
          if (texture && frame &&
            (frame !== char.frame || texture !== char.texture)) {
            char.setProperty('texture', texture);
            char.setProperty('frame', frame);
          }
        }
      });

    this.room.on(
      JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED,
      (id, name) => {
        const char = Hero.charDaemon.getChar(id);
        if (!char) return;
        char.setProperty('name', name);
      });
  }

  sendMessage(message) {
    this.room.sendTextMessage(message);
  }

  _broadcastLocalProperty(property) {
    if (!this.room) return;

    const now = (new Date()).getTime();
    const minDelta = 200;  // ms
    if (now - this._lastBroadcastLocalProperty <= minDelta) return;
    this._lastBroadcastLocalProperty = now;
    try {
      this.room.broadcastEndpointMessage(
        {type: TYPE_PLAYER_PROPERTY, property: property});
    } catch (error) {
      // I don't care...
      console.error('failed to broadcast new property', error);
    }
  }

  update(time, delta, char) {
    this.setLocalParticipantProperty({
      left: char.player.x,
      top: char.player.y,
      texture: char.player.texture.key,
      frame: char.player.frame.name,
    });
    this._broadcastLocalProperty({
       left: char.player.x,
       top: char.player.y,
       texture: char.player.texture.key,
       frame: char.player.frame.name,
    });
  }
}
