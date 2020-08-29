const Stage = require('stage-js/platform/web');
// const common = require('./common.js');
// const game_core = require('./game_core.js');
// const game_object = require('./game_object.js');
const hero = require('./hero.js');
const Map = require('./map.js');
const Textures = require('./textures.js');
// const jitsi_channel = require('./jitsi_channel.js');
const StoryLine = require('./story_line.js');

const charDaemon = new hero.CharDaemon();
const dialogDaemon = new hero.DialogDaemon(charDaemon);

const KEY_MAP = {
  LEFT: 37,
  RIGHT: 39,
  UP: 38,
  DOWN: 40,
  ENTER: 13,
  SPACE: 32,
};

class Keyboard {
  constructor(keys) {
    this.active = {};
    for (const k in keys) {
      const keyCode = keys[k];
      console.log(`adding ${k}: ${keyCode}`);
      this.active[keyCode] = false;
    }
  }

  listen() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  onKeyDown(e) {
    // Don't listen to inputs when there is an active dialog.
    if (dialogDaemon.hasOnGoingDialog) return;

    const keyCode = e.keyCode;
    if (keyCode in this.active) {
      // e.preventDefault();
      this.active[keyCode] = true;
    }
  }

  onKeyUp(e) {
    const keyCode = e.keyCode;
    if (keyCode in this.active) {
      // e.preventDefault();
      this.active[keyCode] = false;
    }
  }
}

class App {

  showLoading() {
    var body = document.body;
    var loading = document.createElement('class');
    loading.className = 'loading';
    if (Stage._supported) {
      loading.innerHTML = 'Loading...';
      loading.style.zIndex = -1;
    } else {
      loading.innerHTML = 'Please use a <a target="_blank" href="https://www.google.com/search?q=modern+browser">modern browser!';
      loading.style.zIndex = 0;
    }
    body.insertBefore(loading, body.firstChild);
  }

  /*
  hideDialog() {
    this.dialogBox.hide();
  }

  showDialog(title, text, buttons) {

    return;
    this.dialogBox.empty();

    const w = this.world.width();
    const h = this.world.height();
    console.log(w, h);
    this.dialogBox.image(Stage.canvas(function(ctx) {
      this.size(w / 2, h / 2);
      ctx.fillStyle = '#555';
      ctx.fillRect(0, 0, w, h);
    }));
    this.dialogBox.show()

    const textBox = Stage.string('text').value(text).pin({align: 0.5});
    textBox.appendTo(this.dialogBox);

    const titleBox = Stage.string('text').value(title).pin({align: 0});
    titleBox.appendTo(this.dialogBox);

    if (buttons) {
      const row = Stage.row();
      for (const button in buttons) {
        if (!buttons.hasOwnProperty(button)) {
          continue;
        }

        const buttonBox = Stage.string('text').value(button);
        buttonBox.on('click', (e) => buttons[button](e));
        buttonBox.appendTo(row);
      }
      row.pin({align: 1});
      row.appendTo(this.dialogBox);
    }

  }
  */

  tick(dt) {
    // dt: delta T in seconds.

    let dx = (!!this.keyboard.active[KEY_MAP.RIGHT] - !!this.keyboard.active[KEY_MAP.LEFT]);
    let dy = (!!this.keyboard.active[KEY_MAP.DOWN] - !!this.keyboard.active[KEY_MAP.UP]);
    if (dx || dy) {
      this.me.move(dt, dx, dy, this.map);
    } else {
      this.me.tick(dt, this.map);
    }

    if (this.keyboard.active[KEY_MAP.ENTER] ||
        this.keyboard.active[KEY_MAP.SPACE]) {
      this.dialogDaemon.startDialog('dialog-1');
      this.keyboard.active[KEY_MAP.ENTER] = false;
      this.keyboard.active[KEY_MAP.SPACE] = false;
    }

    // Move camera on to user.
    const scaleX = this.world.pin('scaleX');
    const scaleY = this.world.pin('scaleY');
    this.world.pin({
      offsetX: -this.me.x * scaleX,
      offsetY: -this.me.y * scaleY,
    });
    return true;
  }

  async initialize() {
    this.showLoading();

    this.keyboard = new Keyboard(KEY_MAP);
    this.keyboard.listen();

    var status = (function() {
      var el = null;
      return function(msg) {
        if (el === null) {
          var el = document.createElement('div');
          el.style.position = 'absolute';
          el.style.color = 'black';
          el.style.background = 'white';
          el.style.zIndex = 999;
          el.style.top = '5px';
          el.style.right = '5px';
          el.style.padding = '1px 5px';
          document.body.appendChild(el);
        }
        el.innerHTML = msg;
      };
    })();

    const storyLine = await StoryLine.loadStoryLine('sample.json');
    //this.me = new hero.Char(32, 32, 'teachers/Headmaster male', '史提米');
    Textures.loadTextures();
    this.me = charDaemon.create('me', 2, 2, 'teachers/Headmaster male', '史提米');
    // this.npc = charDaemon.create('lady-of-lake', 8, 2, 'teachers/Teacher fmale 04', '湖中女神');
    this.npc = charDaemon.create('lady-of-lake', 8, 2, 'teachers/Teacher fmale 04', '失物招領處員工');
    this.dialogDaemon = dialogDaemon;

    dialogDaemon.add('dialog-1', 'lady-of-lake', storyLine[0].steps['step-1'].dialog);

    Stage((stage) => {
      this.stage = stage;

      this.world = new Stage();
      this.world.pin({
        handle: -0.5,
        width: 32 * 40,
        height: 32 * 20,
      }).appendTo(stage);

      this.dialogBox = Stage.image().pin({
        handle: -0.5,
        align: 0.5,
        width: 32 * 40,
        height: 32 * 20,
      }).appendTo(this.stage);

      this.dialogBox.hide();

      stage.on('viewport', (viewport) => {
        this.world.pin({
          scaleMode : 'in-pad',
          scaleWidth : viewport.width,
          scaleHeight : viewport.height,
        });

        this.dialogBox.pin({
          scaleMode : 'in-pad',
          scaleWidth : viewport.width,
          scaleHeight : viewport.height,
        });
      });

      stage.background('#222222');

      (Map.loadMap(this.world, 'stimim-castle-2')).then(
        (map) => {
          this.map = map;
          this.map.init();
          this.me.appendTo(this.map);
          this.npc.appendTo(this.map);
          // dt is delta T in milliseconds, convert it to seconds.
          stage.tick((dt) => this.tick(dt / 1000));
        }
      );

    });
  }
}

app = new App();
app.initialize();
