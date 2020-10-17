import * as Hero from './hero.js';
import * as DataStore from './data_store.js';
import * as StoryLine from './story_line.js';

export var tileMap;

/*
 * tilemapTiledJSON: string, path to tilemap JSON file.
 * storylineJSON: string, path to storyline JSON file.
 */
export function CreateGame(tilemapTiledJSON, storylineJson, connection) {
  const WINDOW_WIDTH = window.innerWidth;
  const WINDOW_HEIGHT = window.innerHeight;
  const DEPTH_BELOW_LAYER = 0;
  const DEPTH_WORLD_LAYER = 10;
  const DEPTH_ABOVE_LAYER = 20;

  let showDebug = false;
  let cursors;
  let sprite;
  let char;

  function preload() {
    this.load.setPath('assets/');
    this.load.image("tiles", "tiles/world.png");
    this.load.tilemapTiledJSON("map", tilemapTiledJSON);

    // An atlas is a way to pack multiple images together into one texture. I'm using it to load all
    // the player animations (walking left, walking right, etc.) in one image. For more info see:
    //  https://labs.phaser.io/view.html?src=src/animation/texture%20atlas%20animation.js
    // If you don't use an atlas, you can do the same thing with a spritesheet, see:
    //  https://labs.phaser.io/view.html?src=src/animation/single%20sprite%20sheet.js
    this.load.atlas("atlas", "atlas/atlas.png", "atlas/atlas.json");
  }

  function create() {
    const map = this.make.tilemap({ key: "map" });

    // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
    // Phaser's cache (i.e. the name you used in preload)
    const tileset = map.addTilesetImage("world", "tiles");

    // Parameters: layer name (or index) from Tiled, tileset, x, y
    const belowLayer = map.createStaticLayer("Below Player", tileset, 0, 0);
    const worldLayer = map.createStaticLayer("World", tileset, 0, 0);
    const aboveLayer = map.createStaticLayer("Above Player", tileset, 0, 0);

    worldLayer.setCollisionByProperty({ collides: true });

    // By default, everything gets depth sorted on the screen in the order we created things. Here, we
    // want the "Above Player" layer to sit on top of the player, so we explicitly give it a depth.
    // Higher depths will sit on top of lower depth objects.
    belowLayer.setDepth(DEPTH_BELOW_LAYER);
    worldLayer.setDepth(DEPTH_WORLD_LAYER);
    aboveLayer.setDepth(DEPTH_ABOVE_LAYER);

    // Object layers in Tiled let you embed extra info into a map - like a spawn point or custom
    // collision shapes. In the tmx file, there's an object layer with a point named "Spawn Point"
    const spawnPoint = map.findObject("Objects", obj => obj.name === "Spawn Point");

    this.charDaemon = Hero.charDaemon;
    this.charDaemon.setPhaser(this);

    // TODO(stimim): move this into another file.
    const NPCs = {
      'convenient-store-npc': {
        name: '便利商店店員',
        x: spawnPoint.x + 128,
        y: spawnPoint.y - 128,
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

    for (const npcId in NPCs) {
      if (!NPCs.hasOwnProperty(npcId)) continue;
      const {name, x, y, texture, frame} = NPCs[npcId];
      this.charDaemon.create(npcId, name, x, y, texture, frame);
    }

    char = this.charDaemon.create(
      'player', '???', spawnPoint.x, spawnPoint.y, 'atlas', 'misa-front');
    sprite = char.player;

    // Watch the player and worldLayer for collisions, for the duration of the scene:
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
    this.physics.add.collider(group, worldLayer);

    this.dialogDaemon = Hero.dialogDaemon;

    // TODO(stimim): properly load game status
    DataStore.AnswerStore.clearAll();

    StoryLine.loadStoryLine(storylineJson).then(
      (storyLine) => {
        this.storyLineDaemon = Hero.storyLineDaemon;
        this.storyLineDaemon.init(storyLine);
      }
    );

    DataStore.AnswerStore.listen('player_name', (e) => {
      char.name = DataStore.AnswerStore.get('player_name');
    });
    // Create the player's walking animations from the texture atlas. These are stored in the global
    // animation manager so any sprite can access them.
    const anims = this.anims;
    anims.create({
      key: "misa-left-walk",
      frames: anims.generateFrameNames("atlas", { prefix: "misa-left-walk.", start: 0, end: 3, zeroPad: 3 }),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: "misa-right-walk",
      frames: anims.generateFrameNames("atlas", { prefix: "misa-right-walk.", start: 0, end: 3, zeroPad: 3 }),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: "misa-front-walk",
      frames: anims.generateFrameNames("atlas", { prefix: "misa-front-walk.", start: 0, end: 3, zeroPad: 3 }),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: "misa-back-walk",
      frames: anims.generateFrameNames("atlas", { prefix: "misa-back-walk.", start: 0, end: 3, zeroPad: 3 }),
      frameRate: 10,
      repeat: -1
    });

    const missionButton = this.add.text(
      WINDOW_WIDTH - 128,
      WINDOW_HEIGHT - 128,
      'Mission', {
        font: '18px monospace',
        fill: '#000',
        backgroundColor: '#fff',
        padding: {x: 10, y: 10},
      }).setScrollFactor(0)
      .setDepth(30)
      .setInteractive();

    missionButton.on('pointerdown', () => {
      this.dialogDaemon.showHint();
    });

    const camera = this.cameras.main;
    camera.startFollow(sprite);
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    cursors = this.input.keyboard.createCursorKeys();
    const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    enterKey.on('down',(key, event) => {
      if (this.dialogDaemon.hasOnGoingDialog) return;
      const dialogId = this.dialogDaemon.findNearbyDialog(sprite);
      if (dialogId !== null) {
        this.dialogDaemon.startDialog(dialogId);
      }
    });

    // Help text that has a "fixed" position on the screen
    this.add
      .text(16, 16, 'Arrow keys to move\nPress "D" to show hitboxes', {
        font: "18px monospace",
        fill: "#000000",
        padding: { x: 20, y: 10 },
        backgroundColor: "#ffffff"
      })
      .setScrollFactor(0)
      .setDepth(30);

    // Debug graphics
    this.input.keyboard.once("keydown_D", event => {
      // Turn on physics debugging to show player's hitbox
      this.physics.world.createDebugGraphic();

      // Create worldLayer collision graphic above the player, but below the help text
      const graphics = this.add
        .graphics()
        .setAlpha(0.75)
        .setDepth(20);
      worldLayer.renderDebug(graphics, {
        tileColor: null, // Color of non-colliding tiles
        collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
        faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
      });
    });
  }

  function update(time, delta) {
    // let's check if we triggered any dialogs
    const dialogId = this.dialogDaemon.checkDialogToTrigger(sprite);
    if (dialogId !== null) {
      this.dialogDaemon.startDialog(dialogId);
      return;
    }

    const speed = 175;
    const prevVelocity = sprite.body.velocity.clone();

    // Stop any previous movement from the last frame
    sprite.body.setVelocity(0);

    // Horizontal movement
    if (cursors.left.isDown) {
      sprite.body.setVelocityX(-speed);
    } else if (cursors.right.isDown) {
      sprite.body.setVelocityX(speed);
    }

    // Vertical movement
    if (cursors.up.isDown) {
      sprite.body.setVelocityY(-speed);
    } else if (cursors.down.isDown) {
      sprite.body.setVelocityY(speed);
    }

    // Normalize and scale the velocity so that player can't move faster along a diagonal
    sprite.body.velocity.normalize().scale(speed);

    // Update the animation last and give left/right animations precedence over up/down animations
    if (cursors.left.isDown) {
      sprite.anims.play("misa-left-walk", true);
    } else if (cursors.right.isDown) {
      sprite.anims.play("misa-right-walk", true);
    } else if (cursors.up.isDown) {
      sprite.anims.play("misa-back-walk", true);
    } else if (cursors.down.isDown) {
      sprite.anims.play("misa-front-walk", true);
    } else {
      sprite.anims.stop();

      // If we were moving, pick and idle frame to use
      if (prevVelocity.x < 0) sprite.setTexture("atlas", "misa-left");
      else if (prevVelocity.x > 0) sprite.setTexture("atlas", "misa-right");
      else if (prevVelocity.y < 0) sprite.setTexture("atlas", "misa-back");
      else if (prevVelocity.y > 0) sprite.setTexture("atlas", "misa-front");
    }

    if (connection) {
      connection.update(time, delta, char);
    }
    this.charDaemon.update();
  }

  const config = {
    type: Phaser.AUTO,
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    parent: "game-container",
    pixelArt: true,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 }
      }
    },
    scene: {
      preload: preload,
      create: create,
      update: update
    }
  };

  const game = new Phaser.Game(config);
  return game;
}

