const DataStore = require('./data_store.js');
const Hero = require('./hero.js');
const StoryLine = require('./story_line.js');

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
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
let cursors;
let player;
let showDebug = false;

function preload() {
  this.load.setPath('assets/');
  this.load.image("tiles", "tiles/world.png");
  this.load.tilemapTiledJSON("map", "maps/idystopia.json");

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
  aboveLayer.setDepth(10);

  // Object layers in Tiled let you embed extra info into a map - like a spawn point or custom
  // collision shapes. In the tmx file, there's an object layer with a point named "Spawn Point"
  const spawnPoint = map.findObject("Objects", obj => obj.name === "Spawn Point");

  this.charDaemon = new Hero.CharDaemon(this);

  /*
  this.charDaemon.create(
    'lost-and-found-npc', '失物招領處員工',
    spawnPoint.x + 64, spawnPoint.y - 64, 'atlas', 'misa-left');
  this.charDaemon.create(
    'lady-of-lake', '湖中女神',
    spawnPoint.x + 128, spawnPoint.y - 128, 'atlas', 'misa-left');
  this.charDaemon.create(
    'registration-npc', '臨櫃人員',
    spawnPoint.x + 128, spawnPoint.y - 256, 'atlas', 'misa-left');
  */

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

  const char = this.charDaemon.create(
    'player', '???', spawnPoint.x, spawnPoint.y, 'atlas', 'misa-front');
  player = char.player;

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

  this.dialogDaemon = new Hero.DialogDaemon(this.charDaemon);

  // TODO(stimim): properly load game status
  DataStore.AnswerStore.clearAll();

  StoryLine.loadStoryLine('regular.json').then(
    (storyLine) => {
      this.storyLineDaemon = new Hero.StoryLineDaemon(storyLine, this.dialogDaemon);
      this.storyLineDaemon.init();
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

  const missionButton = this.add.text(512 + 128, 512, 'Mission', {
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
  camera.startFollow(player);
  camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

  cursors = this.input.keyboard.createCursorKeys();
  const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  enterKey.on('down',(key, event) => {
    if (this.dialogDaemon.hasOnGoingDialog) return;
    const dialogId = this.dialogDaemon.findNearbyDialog(player);
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
  const dialogId = this.dialogDaemon.checkDialogToTrigger(player);
  if (dialogId !== null) {
    this.dialogDaemon.startDialog(dialogId);
    return;
  }

  const speed = 175;
  const prevVelocity = player.body.velocity.clone();

  // Stop any previous movement from the last frame
  player.body.setVelocity(0);

  // Horizontal movement
  if (cursors.left.isDown) {
    player.body.setVelocityX(-speed);
  } else if (cursors.right.isDown) {
    player.body.setVelocityX(speed);
  }

  // Vertical movement
  if (cursors.up.isDown) {
    player.body.setVelocityY(-speed);
  } else if (cursors.down.isDown) {
    player.body.setVelocityY(speed);
  }

  // Normalize and scale the velocity so that player can't move faster along a diagonal
  player.body.velocity.normalize().scale(speed);

  // Update the animation last and give left/right animations precedence over up/down animations
  if (cursors.left.isDown) {
    player.anims.play("misa-left-walk", true);
  } else if (cursors.right.isDown) {
    player.anims.play("misa-right-walk", true);
  } else if (cursors.up.isDown) {
    player.anims.play("misa-back-walk", true);
  } else if (cursors.down.isDown) {
    player.anims.play("misa-front-walk", true);
  } else {
    player.anims.stop();

    // If we were moving, pick and idle frame to use
    if (prevVelocity.x < 0) player.setTexture("atlas", "misa-left");
    else if (prevVelocity.x > 0) player.setTexture("atlas", "misa-right");
    else if (prevVelocity.y < 0) player.setTexture("atlas", "misa-back");
    else if (prevVelocity.y > 0) player.setTexture("atlas", "misa-front");
  }
  this.charDaemon.update();
}
