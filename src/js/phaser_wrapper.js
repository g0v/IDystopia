import * as Hero from './hero.js';
import * as DataStore from './data_store.js';
import * as StoryLine from './story_line.js';
import * as JitsiChannel from './jitsi_channel.js';
import * as Const from './const.js';

export var tileMap;

export var mapObjects = {};

let char;
var config = {};
let cursors = {
  left: { isDown: false },
  right: { isDown: false },
  up: { isDown: false },
  down: { isDown: false },
};
const WINDOW_WIDTH = window.innerWidth;
const WINDOW_HEIGHT = window.innerHeight;
const DEPTH_BELOW_LAYER = 0;
const DEPTH_WORLD_LAYER = 10;
const DEPTH_ABOVE_LAYER = 20;
const DEPTH_MASK_LAYER = 30;
const DEPTH_DIALOG_LAYER = 99;

class IntroScene extends Phaser.Scene {
  constructor () {
    super('Intro');
  }

  preload() {
    this.load.setPath('assets/');
    if (this.sys.game.device.os.desktop) {
      this.load.video('intro', 'media/idystopia.mp4');
    } else {
      this.load.video('intro', 'media/idystopia_480p.mp4');
    }
  }

  create() {
    const video = this.add.video(WINDOW_WIDTH / 2, WINDOW_HEIGHT / 2, 'intro');
    video.setMute(true);

    const width = video.width;
    const height = video.height;
    const scale = Math.min(WINDOW_WIDTH / width, WINDOW_HEIGHT / height);
    video.setScale(scale);
    console.log("playing video");
    video.play();

    video.on('complete', video => {
      video.play(true, 6, 8);
    });

    if (this.sys.game.device.os.desktop) {
      this.add.text(WINDOW_WIDTH / 2, WINDOW_HEIGHT * 0.9,
        'press ENTER to continue...', {
          font: '18px monospace',
          fill: '#ffffff',
          padding: {x: 20, y: 20},
        }).setDepth(DEPTH_DIALOG_LAYER).setOrigin(0.5);
    } else {
      this.add.text(WINDOW_WIDTH / 2, WINDOW_HEIGHT * 0.9,
        'Touch screen to continue...', {
          font: '18px monospace',
          fill: '#ffffff',
          padding: {x: 20, y: 20},
        }).setDepth(DEPTH_DIALOG_LAYER).setOrigin(0.5);
    }

    this.input.keyboard.once('keydown_ENTER', () => {
      this.startNextScene();
    });

    this.input.on('pointerup', () => {
      this.startNextScene();
    }, this);
  }

  startNextScene() {
    // this.scene.add('Game', Game, true);
    this.scene.start('Game');
    this.scene.remove('Intro');
  }
}


class GameScene extends Phaser.Scene {
  constructor () {
    super('Game');
  }

  preload() {
    console.log('Preload Game scene');
    const {tilemapTiledJSON, storylineJSON, npcList} = config;

    this.load.setPath('assets/');
    this.load.image("tiles", "tiles/world.png");
    this.load.image("vision", "symbols/mask.png");
    this.load.audio('hospital', 'audio/hospital.mp3');
    this.load.tilemapTiledJSON("map", `${tilemapTiledJSON}?v=202012051335`);
    // An atlas is a way to pack multiple images together into one texture. I'm
    // using it to load all the player animations (walking left, walking right,
    // etc.) in one image. For more info see:
    // https://labs.phaser.io/view.html?src=src/animation/texture%20atlas%20animation.js
    // If you don't use an atlas, you can do the same thing with a this.playersheet,
    // see:
    // https://labs.phaser.io/view.html?src=src/animation/single%20this.player%20sheet.js
    this.load.atlas("atlas", "atlas/atlas.png", "atlas/atlas.json");
  }

  onDoneCreate() {
    $( '#button-show-mission' ).show();
    $( '#button-join-online-event' ).show();

    const {storylineJSON} = config;
    const {gameSceneConfig} = config;
    const {postBootCallback} = gameSceneConfig;

    DataStore.AnswerStore.clearAll();

    StoryLine.loadStoryLine(storylineJSON).then(
      (storyLine) => {
        this.storyLineDaemon = Hero.storyLineDaemon;
        this.storyLineDaemon.init(storyLine);
      }
    );

    DataStore.AnswerStore.listen('player_name', () => {
      char.name = DataStore.AnswerStore.get('player_name');
    });

    if (postBootCallback) {
      postBootCallback();
    }
  }

  create() {
    this.hospitalBackgroundMusic = this.sound.add('hospital', {
      loop: true,
      volume: 0.5,
    });
    if (config.isCLabEnv) {
      this.sound.pauseOnBlur = false;
    }
    if (this.sound.locked) {
      this.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
        this.hospitalBackgroundMusic.play();
      });
    } else {
      this.hospitalBackgroundMusic.play();
    }

    console.log('Create Game scene');
    const {npcList} = config;
    const map = this.make.tilemap({ key: "map" });

    // Parameters are the name you gave the tileset in Tiled and then the key of
    // the tileset image in Phaser's cache (i.e. the name you used in preload)
    const tileset = map.addTilesetImage("world", "tiles");

    // Parameters: layer name (or index) from Tiled, tileset, x, y
    this.belowLayer = map.createStaticLayer("Below Player", tileset, 0, 0);
    this.worldLayer = map.createStaticLayer("World", tileset, 0, 0);
    this.aboveLayer = map.createStaticLayer("Above Player", tileset, 0, 0);

    this.worldLayer.setCollisionByProperty({ collides: true });

    // By default, everything gets depth sorted on the screen in the order we
    // created things. Here, we want the "Above Player" layer to sit on top of
    // the player, so we explicitly give it a depth.  Higher depths will sit on
    // top of lower depth objects.
    this.belowLayer.setDepth(DEPTH_BELOW_LAYER);
    this.worldLayer.setDepth(DEPTH_WORLD_LAYER);
    this.aboveLayer.setDepth(DEPTH_ABOVE_LAYER);

    window.objectLayer = map.getObjectLayer('Objects');
    // Object layers in Tiled let you embed extra info into a map - like a spawn
    // point or custom collision shapes.
    map.getObjectLayer('Objects').objects.forEach(
      obj => {mapObjects[obj.name] = obj});

    this.charDaemon = Hero.charDaemon;
    this.charDaemon.setScene(this);

    if (npcList) {
      for (const npcId in npcList) {
        const {name, texture, frame} = npcList[npcId];
        if (!(npcId in mapObjects)) {
          continue;
        }
        const point = mapObjects[npcId];

        if (npcList[npcId].movements) {
          this.charDaemon.createMovingNPC(
            npcId, name, point.x, point.y, texture, frame,
            npcList[npcId].movements);
        } else {
          this.charDaemon.create(npcId, name, point.x, point.y, texture, frame);
        }
      }
    }

    const home = mapObjects['HOME'];
    char = this.charDaemon.create(
      'player', '???', home.x, home.y, 'atlas', 'misa-front');
    this.player = char.player;

    this.vision = this.make.image({
      x: this.player.x,
      y: this.player.y,
      key: 'vision',
      add: false
    });
    this.vision.setScale(1.5);

    console.log('create texture');
    const makeMask = () => {
      if (this.mask) {
        if (this.mask.mask) {
          this.mask.mask.destroy();
        }
        this.mask.destroy();
      }

      this.mask = this.make.renderTexture({
        x: this.player.x,
        y: this.player.y,
        width: 2 * this.scale.width,
        height: 2 * this.scale.height,
      }, true);
      this.mask.fill(0x000000, 1);
      this.mask.setTint(0x0a2948);
      this.mask.setDepth(DEPTH_MASK_LAYER);
      this.mask.setOrigin(0.5);

      this.mask.mask = new Phaser.Display.Masks.BitmapMask(this, this.vision)
      this.mask.mask.invertAlpha = true
    };

    makeMask();
    this.scale.on('resize', () => {
      console.log('resize', this.scale.width, this.scale.height);
      makeMask();
    });

    // Watch the player and worldLayer for collisions, for the duration of the
    // scene:
    const group = this.physics.add.group();

    for (const id in this.charDaemon.chars) {
      if (this.charDaemon.chars.hasOwnProperty(id)) {
        const p = this.charDaemon.chars[id].player;
        group.add(p);
        // I don't know why, but I can't do this in Char.makeContainer function.
        // And we must not set player as immovable.
        if (id !== 'player') {
          p.setImmovable(true);
        }
      }
    }

    this.physics.add.collider(group, group);
    this.physics.add.collider(group, this.worldLayer);

    this.dialogDaemon = Hero.dialogDaemon;

    // Create the player's walking animations from the texture atlas. These are
    // stored in the global animation manager so any this.player can access them.
    const anims = this.anims;
    anims.create({
      key: "misa-left-walk",
      frames: anims.generateFrameNames(
        "atlas", { prefix: "misa-left-walk.", start: 0, end: 3, zeroPad: 3 }),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: "misa-right-walk",
      frames: anims.generateFrameNames(
        "atlas", { prefix: "misa-right-walk.", start: 0, end: 3, zeroPad: 3 }),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: "misa-front-walk",
      frames: anims.generateFrameNames(
        "atlas", { prefix: "misa-front-walk.", start: 0, end: 3, zeroPad: 3 }),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: "misa-back-walk",
      frames: anims.generateFrameNames(
        "atlas", { prefix: "misa-back-walk.", start: 0, end: 3, zeroPad: 3 }),
      frameRate: 10,
      repeat: -1
    });

    const camera = this.cameras.main;
    camera.startFollow(this.player);
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    const cursorKeys = [
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
    ];

    for (const keyCode of cursorKeys) {
      const key = this.input.keyboard.addKey(keyCode, false);
      key.on('down', (key, event) => {
        this.lastUserInputTimestamp = (new Date()).getTime();
        if (this.dialogDaemon.hasOnGoingDialog) return;
        switch (event.keyCode) {
          case Phaser.Input.Keyboard.KeyCodes.LEFT:
            cursors.left.isDown = true;
            break;
          case Phaser.Input.Keyboard.KeyCodes.RIGHT:
            cursors.right.isDown = true;
            break;
          case Phaser.Input.Keyboard.KeyCodes.UP:
            cursors.up.isDown = true;
            break;
          case Phaser.Input.Keyboard.KeyCodes.DOWN:
            cursors.down.isDown = true;
            break;
        }
      });
      key.on('up', (key, event) => {
        this.lastUserInputTimestamp = (new Date()).getTime();
        switch (event.keyCode) {
          case Phaser.Input.Keyboard.KeyCodes.LEFT:
            cursors.left.isDown = false;
            break;
          case Phaser.Input.Keyboard.KeyCodes.RIGHT:
            cursors.right.isDown = false;
            break;
          case Phaser.Input.Keyboard.KeyCodes.UP:
            cursors.up.isDown = false;
            break;
          case Phaser.Input.Keyboard.KeyCodes.DOWN:
            cursors.down.isDown = false;
            break;
        }
      });
    }

    const enterKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER, false);
    enterKey.on('down', () => {
      this.lastUserInputTimestamp = (new Date()).getTime();
      if (this.dialogDaemon.hasOnGoingDialog) return;
      const dialogId = this.dialogDaemon.findNearbyDialog(this.player);
      if (dialogId !== null) {
        this.dialogDaemon.startDialog(dialogId);
      }
    });

    // Help text that has a "fixed" position on the screen
    if (this.sys.game.device.os.desktop) {
      $('#joystick').hide();
      this.add
        .text(16, 16, 'Arrow keys to move\nPress "Enter" to interact', {
          font: "18px monospace",
          fill: "#000000",
          padding: { x: 20, y: 10 },
          backgroundColor: "#ffffff"
        })
        .setScrollFactor(0)
        .setDepth(30);
    } else {
      $('#joystick').show();
      this.add
        .text(16, 16, 'Use joysticks to move\nPress the stick to interact', {
          font: "18px monospace",
          fill: "#000000",
          padding: { x: 20, y: 10 },
          backgroundColor: "#ffffff"
        })
        .setScrollFactor(0)
        .setDepth(30);
    }
    // Debug graphics
    this.input.keyboard.once("keydown_D", event => {
      // Turn on physics debugging to show player's hitbox
      this.physics.world.createDebugGraphic();

      // Create worldLayer collision graphic above the player, but below the
      // help text
      const graphics = this.add
        .graphics()
        .setAlpha(0.75)
        .setDepth(20);
      this.worldLayer.renderDebug(graphics, {
        tileColor: null,
        collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255),
        faceColor: new Phaser.Display.Color(40, 39, 37, 255),
      });
    });

    // joystick
    const stick = $("#joystick .touch-stick");
    var limit = $("#joystick").width()/2;
    var dead = 0.3;
    var centerX = $("#joystick").position().left + $("#joystick").width()/2;
    var centerY = $("#joystick").position().top + $("#joystick").height()/2;

    function initJoystick() {
      centerX = $("#joystick").position().left + $("#joystick").width()/2;
      centerY = $("#joystick").position().top + $("#joystick").height()/2;
      limit = $("#joystick").width()/2;
    }
    $(window).on('resize', function(){
      initJoystick();
    });

    let tap = false;
    $("#joystick").on('touchmove', (e) => {
      e.preventDefault();
      tap = false;

      if (this.dialogDaemon.hasOnGoingDialog) {
        cursors.left.isDown = false;
        cursors.right.isDown = false;
        cursors.up.isDown = false;
        cursors.down.isDown = false;
        return;
      }

      const touch = e.originalEvent.targetTouches[0];
      let deltaX = (touch.pageX - centerX) / limit;
      let deltaY = (touch.pageY - centerY) / limit;
      deltaX = Math.min(Math.max(deltaX, -1), 1);
      deltaY = Math.min(Math.max(deltaY, -1), 1);
      stick.css({"left": `${deltaX*50 + 50}%`, "top": `${deltaY*50 + 50}%`});

      if(Math.abs(deltaX) < dead) {
        deltaX = 0;
        cursors.left.isDown = false;
        cursors.right.isDown = false;
      }
      if(Math.abs(deltaY) < dead) {
        deltaY = 0;
        cursors.up.isDown = false;
        cursors.down.isDown = false;
      }
      if(Math.abs(deltaX) >= Math.abs(deltaY)) {
        if(deltaX > 0){
          cursors.right.isDown = true;
          cursors.left.isDown = false;
        } else {
          cursors.right.isDown = false;
          cursors.left.isDown = true;
        }
      } else {
        if(deltaY < 0){
          cursors.up.isDown = true;
          cursors.down.isDown = false;
        } else {
          cursors.up.isDown = false;
          cursors.down.isDown = true;
        }
      }
    });
    $("#joystick").on('touchstart','.touch-stick', () => {
      tap = true;
    });
    $("#joystick").on('touchend','.touch-stick', () => {
      $("#joystick .touch-stick").css({"left": '50%', "top": '50%'});
      cursors.up.isDown = false;
      cursors.down.isDown = false;
      cursors.left.isDown = false;
      cursors.right.isDown = false;
      if(tap) {
        if (this.dialogDaemon.hasOnGoingDialog) return;
        const dialogId = this.dialogDaemon.findNearbyDialog(this.player);
        if (dialogId !== null) {
          this.dialogDaemon.startDialog(dialogId);
        }
      }
    });

    this.onDoneCreate();
  }

  update(time, delta) {
    if (this.vision && this.mask) {
      if (config.connection) {
        this.mask.visible = false;
      } else {
        this.mask.visible = true;
        this.vision.x = this.player.x;
        this.vision.y = this.player.y;
        this.mask.x = this.player.x;
        this.mask.y = this.player.y;
      }
    }

    // let's check if we triggered any dialogs

    const dialogId = this.dialogDaemon.checkDialogToTrigger(this.player);
    if (dialogId !== null) {
      this.dialogDaemon.startDialog(dialogId);
      return;
    }

    const prevVelocity = this.player.body.velocity.clone();

    // Stop any previous movement from the last frame
    this.player.body.setVelocity(0);

    let vX = 0;
    let vY = 0;

    if (!this.dialogDaemon.hasOnGoingDialog) {
      // Horizontal movement
      if (cursors.left.isDown) {
        vX = -Const.SPEED;
      } else if (cursors.right.isDown) {
        vX = Const.SPEED;
      }

      // Vertical movement
      if (cursors.up.isDown) {
        vY = -Const.SPEED;
      } else if (cursors.down.isDown) {
        vY = Const.SPEED;
      }
    }

    this.player.body.setVelocityX(vX);
    this.player.body.setVelocityY(vY);
    if (vX || vY) {
      // Normalize and scale the velocity so that player can't move faster along a
      // diagonal
      this.player.body.velocity.normalize().scale(Const.SPEED);
    }

    if (config.isCLabEnv) {
      const now = (new Date()).getTime();
      if (!this.lastUserInputTimestamp) {
        this.lastUserInputTimestamp = now;
      } else if (now - this.lastUserInputTimestamp > 5 * 60 * 1000) {
        // Idle for more than 5 minutes.
        this.scene.pause();
        bootbox.confirm({
          title: 'Timed out',
          message: '太久沒有操作，是否重新開始遊戲？',
          buttons: {
            cancel: {
              label: '繼續遊戲',
            },
            confirm: {
              label: '重新開始',
            }
          },
          callback: (result) => {
            if (result) {
              this.lastUserInputTimestamp = (new Date()).getTime();
              this.scene.resume();
              location.reload();
            } else {
              this.lastUserInputTimestamp = (new Date()).getTime();
              this.scene.resume();
            }
          }
        });
      }
    }

    // Update the animation last and give left/right animations precedence over
    // up/down animations

    if (vX < 0) {
      this.player.anims.play("misa-left-walk", true);
    } else if (vX > 0) {
      this.player.anims.play("misa-right-walk", true);
    } else if (vY < 0) {
      this.player.anims.play("misa-back-walk", true);
    } else if (vY > 0) {
      this.player.anims.play("misa-front-walk", true);
    } else {
      this.player.anims.stop();

      // If we were moving, pick and idle frame to use
      if (prevVelocity.x < 0) this.player.setTexture("atlas", "misa-left");
      else if (prevVelocity.x > 0) this.player.setTexture("atlas", "misa-right");
      else if (prevVelocity.y < 0) this.player.setTexture("atlas", "misa-back");
      else if (prevVelocity.y > 0) this.player.setTexture("atlas", "misa-front");
    }

    if (config.connection) {
      config.connection.update(time, delta, char);
    }

    this.charDaemon.update(time, delta);
  }
}

/*
 * tilemapTiledJSON: string, path to tilemap JSON file.
 * storylineJSON: string, path to storyline JSON file.
 */
export function CreateGame({
    tilemapTiledJSON, storylineJSON, connection, npcList,
    postBootCallback, isCLabEnv}) {
  config = {
    type: Phaser.AUTO,
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    parent: "game-container",
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 }
      }
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: '100%',
      height: '100%',
    },
    scene: [IntroScene, GameScene],
    gameSceneConfig: {
      postBootCallback
    },
    tilemapTiledJSON,
    storylineJSON,
    connection,
    npcList,
    isCLabEnv,
  };

  const game = new Phaser.Game(config);
  game.joinOnlineEvent = () => {
    const conn = new JitsiChannel.JitsiConnection();
    conn.init();
    config.connection = conn;
    conn.setDisplayName(DataStore.AnswerStore.get('player_name'));
    DataStore.AnswerStore.listen('player_name', () => {
      conn.setDisplayName(DataStore.AnswerStore.get('player_name'));
    });
    // const spawnPoint = 'online-event-spawn-point';
    const spawnPoint = 'SCHOOL-ENTRY';
    Hero.dialogDaemon.moveTo(spawnPoint, () => {});
    $( '#online-panel' ).show();
  };
  game.sendMessage = (message) => {
    config.connection.sendMessage(message);
  }
  return game;

}
