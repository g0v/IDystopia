const stick = $("#joystick .touch-stick");
var limit = $("#joystick").width()/2;
var dead = 0.2;
var center_x = $("#joystick").position().left + $("#joystick").width()/2;
var center_y = $("#joystick").position().top + $("#joystick").height()/2;
var nowStat = "C";

function init() {
  center_x = $("#joystick").position().left + $("#joystick").width()/2;
  center_y = $("#joystick").position().top + $("#joystick").height()/2;
  limit = $("#joystick").width()/2;
}
$(window).on('resize', function(){
  init();
});
$("#joystick").on('touchmove','.touch-stick', function(e){
  var touch = e.originalEvent.targetTouches[0];
  var delta_x = (touch.pageX-center_x)/limit;
  var delta_y = (touch.pageY-center_y)/limit;
  delta_x = Math.min(Math.max(delta_x, -1), 1);
  delta_y = Math.min(Math.max(delta_y, -1), 1);
  if(Math.abs(delta_x)<dead && Math.abs(delta_y)<dead) {
    delta_x = 0;
    delta_y = 0;
  }
  $(this).css({"left": `${delta_x*50 + 50}%`, "top": `${delta_y*50 + 50}%`});

  if(delta_x == 0 && delta_y == 0) {
    nowStat = "C";
  }
  else if(Math.abs(delta_x) >= Math.abs(delta_y)) {
    if(delta_x > 0){
      nowStat = "E";
    }
    else {
      nowStat = "W";
    }
  }
  else {
    if(delta_y < 0){
      nowStat = "N";
    }
    else {
      nowStat = "S";
    }
  }
});
$("#joystick").on('touchend','.touch-stick', function(e){
  $(this).css({"left": '50%', "top": '50%'});
  nowStat = "C";
});

$("#joypads").on('touchstart', '.touch-pad', function(e){
  console.log($(this).data("pad"));
});

setInterval(function(){
  var e = jQuery.Event("keydown");
  e.which = 38;
  console.log(nowStat);
  switch (nowStat) {
    case "C": //stop

      break;
    case "N": //上
      $(window).trigger(e);
      break;
    case "S": //下

      break;
    case "W": //左

      break;
    case "E": //右

      break;
  }
}, 100);
