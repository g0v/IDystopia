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

/**
 * A class to handle Jitsi connection of a room.
 */
export class JitsiConnection {
  constructor() {
    this.connection = null;
    this.room = null;
    this.cameraTrack = null;
    this.previousUpdateTime = 0;
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
      bosh: 'wss://jitsi.jothon.online/xmpp-websocket',
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

  }

  _initConferenceRoom() {
    // const roomId = 'idystopia_online';
    const roomId = 'eid';
    console.log('roomId: ', roomId);
    if (this.room) {
      return this.room;
    }
    const confOptions = {
      openBridgeChannel: true,
      confID: `jitsi.jothon.online/${roomId}`,
    };

    this.room = this.connection.initJitsiConference(roomId, confOptions);

    this.room.setDisplayName('???');
    this.setLocalParticipantProperty({
      top: 0,
      left: 0,
      texture: 'atlas',
      frame: 'misa-left',
    });
    this.room.on(
      JitsiMeetJS.events.conference.CONFERENCE_JOINED,
      () => { this.onConferenceJoined(); });

    this.room.join();

    return this.room;
  }

  setLocalParticipantProperty(properties) {
    if (this.room) {
      for (const key in properties) {
        this.room.setLocalParticipantProperty(key, properties[key]);
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

      console.log(id, user);

      const char = Hero.charDaemon.getChar(id);
      if (char) continue;

      Hero.charDaemon.createRemotePlayer(
        id,
        user.getDisplayName(),
        parseInt(user.getProperty('left')),
        parseInt(user.getProperty('top')),
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
        Hero.charDaemon.createRemotePlayer(id, user.getDisplayName());
      });

    this.room.on(
      JitsiMeetJS.events.conference.MESSAGE_RECEIVED,
      (id, text, timestamp) => {
        console.log({id, text, timestamp});
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
      (/* participant, message */) => {});
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

  update(time, delta, char) {
    const now = (new Date()).getTime();
    const minDelta = 200;  // 0.2 seconds
    if (now - this.previousUpdateTime > minDelta) {
      this.previousUpdateTime = now;
      this.setLocalParticipantProperty({
        left: char.player.x,
        top: char.player.y,
        texture: char.player.texture.key,
        frame: char.player.frame.name,
      });
    }
  }
}
