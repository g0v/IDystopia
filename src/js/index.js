const Stage = require('stage-js/platform/web');
// const common = require('./common.js');
const game_core = require('./game_core.js');
const game_object = require('./game_object.js');
const hero = require('./hero.js');
// const jitsi_channel = require('./jitsi_channel.js');

function initialize() {
  (function() {
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
  })();

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

  Stage(function(stage) {
    stage.viewbox(300, 200);
    var box = Stage.image('teacher').appendTo(stage);
    stage.background('#222222');
    // Align box to center
    box.pin('align', 0.5);

    // On mouse click...
    box.on('click', function(point) {
      // ...tween scale values of this node
      this.tween().ease('bounce').pin({
        scaleX : Math.random() + 0.5,
        scaleY : Math.random() + 0.5
      });
    });
  });

  Stage({
    image : '/sprite/teachers/Headmaster male.png',
    textures : {
      teacher : { x : 0, y : 0, width : 32, height : 32 }
    }
  });
}

initialize();
