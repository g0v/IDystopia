const Stage = require('stage-js/platform/web');
// const common = require('./common.js');
const game_core = require('./game_core.js');
const game_object = require('./game_object.js');
const hero = require('./hero.js');
// const jitsi_channel = require('./jitsi_channel.js');

const KEY_MAP = {
  LEFT: 37,
  RIGHT: 39,
  UP: 38,
  DOWN: 40,
  ENTER: 13,
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
    const keyCode = e.keyCode;
    if (keyCode in this.active) {
      e.preventDefault();
      this.active[keyCode] = true;
    }
  }

  onKeyUp(e) {
    const keyCode = e.keyCode;
    if (keyCode in this.active) {
      e.preventDefault();
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

  tick(dt) {
    // dt: delta T in seconds.
    // speed: move 256 pixels per second.
    const speed = 256;
    let dx = (-!!this.keyboard.active[KEY_MAP.LEFT] + !!this.keyboard.active[KEY_MAP.RIGHT]);
    let dy = (-!!this.keyboard.active[KEY_MAP.UP] + !!this.keyboard.active[KEY_MAP.DOWN]);

    if (dx || dy) {
      this.me.targetX = this.me.x + dx * dt * speed;
      this.me.targetY = this.me.y + dy * dt * speed;
      //const x = this.box.pin('offsetX');
      //const y = this.box.pin('offsetY');
      //this.box.pin({
        //'offsetX': x + dx * dt * speed,
        //'offsetY': y + dy * dt * speed,
      //});
    }
    this.me.tick(dt);
    return true;
  }

  initialize() {
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

    Stage({
      textures : {
        text : function(text, style) {
          text += '';
          style = style || {};
          return Stage.canvas(function(ctx) {
            var ratio = 2;

            ctx.font = style.font || 'normal 12px Arial';
            const dim = ctx.measureText(text);

            this.size(dim.width, 12, ratio);
            ctx.scale(ratio, ratio);
            // TODO(stimim): figure out why do we need to set this again...
            // I guess this is related to the "ratio" setting.
            ctx.font = style.font || 'normal 12px Arial';
            ctx.fillStyle = style.fillStyle || '#ddd';
            ctx.textBaseline = 'top';
            ctx.fillText(text, 0, 0);
          });
        }
      }
    });

    //this.me = new hero.Char(32, 32, 'teachers/Headmaster male', '史提米');
    this.me = new hero.Char(32, 32, 'teachers/Headmaster male', 'stimim');
    Stage((stage) => {
      stage.viewbox(32 * 40, 32 * 20);
      stage.background('#222222');

      this.me.appendTo(stage);

      // dt is delta T in milliseconds, convert it to seconds.
      stage.tick((dt) => this.tick(dt / 1000));
    });

    // Texture
    //Stage({
      //image : '/sprite/teachers/Headmaster male.png',
      //textures : {
        //teacher : { x : 0, y : 0, width : 32, height : 32 }
      //}
    //});
  }

}

app = new App();
app.initialize();
