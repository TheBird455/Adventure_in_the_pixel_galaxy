  $(document).ready(function(){
  starting_menu();
  
  start();
});

const Difficulty = {
  EASY: 0,
  NORMAL:1,
  HARD:2,
}

class Settings {
 constructor() {
   
 }
 
setDifficulty(difficulty) {
   this._difficulty = difficulty;
   $("#difficulty_menu a").removeClass("selected");
   switch (difficulty){
     case Difficulty.EASY:
       $("#easy").addClass("selected");
       break;
     case Difficulty.NORMAL:
       $("#normal").addClass("selected");
       break;
     case Difficulty.HARD:
       $("#hard").addClass("selected");
       break;
   }
 }
}

var settings = new Settings();

var canvas;
var canvasWidth;
var canvasHeight;
var myx,myy,myscale,myangle;
var myvx, myvy, myomega;

myvx = 0;
myvy = 0;
myomega = 0;

// min/max for stars not canvas
var xMin = -10;
var yMin = -10;
var xMax = 10;
var yMax = 10;
var delta_v = 0.1;
var deltaomega = 0.05;
var max_v = 20.0;
var maxomega = 5;
var bullet_v0 = -20;

var spaceShipImage;

var bulletImage;
// todo rotate
function canvasx(x,y,myWidth,myHeight){
  return (x)*myscale+canvasWidth/2-myWidth/2;
}
function canvasy(x,y,myWidth,myHeight){
  return (y)*myscale+canvasHeight/2-myHeight/2;
}
var starCoordinates = [];
var bulletCoordinates = [];
var bulletVelocities  = [];

// TODO star colors and size
function start(){
  settings.setDifficulty(Difficulty.NORMAL);
  canvas = $("canvas");
  myx = 0;
  myy = 0;
  spaceShipImage = new Image();
  spaceShipImage.src = "externalfile:drive-f2977043b6f3a20e5bf17381dcf2163b70320591/root/coding/spaceship2.png"
  
  bulletImage = new Image();
  bulletImage.src = "externalfile:drive-f2977043b6f3a20e5bf17381dcf2163b70320591/root/coding/bullet 3.png";
}

function nextCoordinates(x,y, vx, vy) {
  x += vx * delta_t / 1000;
  y += vy * delta_t / 1000;
  
  x -= myvx * delta_t / 1000;
  y -= myvy * delta_t / 1000;
  omega = myomega * delta_t / 1000;
  
  next_x =  x * Math.cos(omega) + y * Math.sin(omega);
  next_y = -x * Math.sin(omega) + y * Math.cos(omega);
  
  return [next_x, next_y];
}

function nextVelocities(vx, vy) {
  next_vx =  vx * Math.cos(omega) + vy * Math.sin(omega);
  next_vy = -vx * Math.sin(omega) + vy * Math.cos(omega);
  
  return [next_vx, next_vy];
}

function moveCoordinates(){
  for (i=0;i<numberOfStars;i++) {
    starx=starCoordinates[i][0];
    stary=starCoordinates[i][1];
    
    starCoordinates[i] = nextCoordinates(starx, stary, 0, 0);
  }
  
  for (i=0;i<bulletCoordinates.length;i++) {
    bulletx = bulletCoordinates[i][0];
    bullety = bulletCoordinates[i][1];
    
    bulletvx = bulletVelocities[i][0];
    bulletvy = bulletVelocities[i][1];
    
    bulletVelocities[i]  = nextVelocities(bulletvx, bulletvy);
    bulletCoordinates[i] = nextCoordinates(bulletx, bullety, bulletvx, bulletvy);
  }
}

function redraw(){
  canvasWidth = canvas.width();
  canvasHeight = canvas.height();
  canvas.attr("width", canvasWidth);
  canvas.attr("height", canvasHeight);
  myscale = canvasWidth/20;// coordinates from -10 to 10
  context = canvas.get(0).getContext("2d");
  context.imageSmoothingEnabled = false;
  for (i=0;i<numberOfStars;i++) {
    starRadius=1;
    starx=starCoordinates[i][0];
    stary=starCoordinates[i][1];
    
    if ((Math.abs(starx - myx) > 20) || (Math.abs(stary - myy) > 20)) {
      starCoordinates[i] = ([Math.random()*(xMax - xMin) + xMin + myx, Math.random()*(yMax - yMin) + yMin + myy]);
    }
    
    centerx=canvasx(starx,stary,2*starRadius,2*starRadius);
    centery=canvasy(starx,stary,2*starRadius,2*starRadius);
    context.beginPath();
    context.arc(centerx,centery,starRadius,0,2*Math.PI,false);
    context.strokeStyle = "#888";
    context.stroke();
  }
  
  for (i=0;i<bulletCoordinates.length;i++) {
    bullet_xy = bulletCoordinates[i];
    
    context.drawImage(
      bulletImage,
      canvasx(bullet_xy[0],bullet_xy[1],bulletImage.width, bulletImage.height),
      canvasy(bullet_xy[0],bullet_xy[1],bulletImage.width, bulletImage.height));
  }
  
  context.drawImage(
    spaceShipImage,
    canvasx(0, 0, spaceShipImage.width,spaceShipImage.height),
    canvasy(0, 0, spaceShipImage.width,spaceShipImage.height)
    );
}

function starting_menu(){
  $("#start").click(function(event){
   $("#start_menu").toggle();
  });
  
  $("#new_game").click(function(event){
    new_game();
  });
  
  $("#options").click(function(event){
   $("#option_menu").toggle();
  });
  
  $("#difficulty").click(function(event){
    $("#difficulty_menu").toggle();
  });
  
  $("#easy").click(function(event){
    settings.setDifficulty(Difficulty.EASY);
  });
  
  $("#normal").click(function(event){
    settings.setDifficulty(Difficulty.NORMAL);
  });
  
  $("#hard").click(function(event){
    settings.setDifficulty(Difficulty.HARD);
  });

  
}

var numberOfStars = 400;




function initStarfield() {
  for (i=0;i<numberOfStars;i++) {
    starCoordinates.push([Math.random()*(xMax - xMin) + xMin, Math.random()*(yMax - yMin) + yMin])
  }
}

 var keyMap= new Set();
 var delta_t = 10;
 var redraw_delta_t = 50;
function new_game(){
  $("#starting_menu").hide();
  $("#GameCanvas").show();
  $("#title").hide();
  $("#music1")[0].pause();
  $("body").css("background-image","none");
  $("body").css("background","black");
  initStarfield();
   $(document).keyup(function(event) {
          keyMap.delete(event.keyCode);
          });
        $(document).keydown(function(event) {
          keyMap.add(event.keyCode);
        });
         timer =setInterval(propagate,delta_t);
         redrawTimer = setInterval(redraw,redraw_delta_t);
}

function propagate(){
  keyHandler();
  moveCoordinates();
 
}

function fire() {
  bulletCoordinates.push([0,0]);
  bulletVelocities.push([0, bullet_v0]);
}

      function keyHandler(){
        for(let keyCode of keyMap.values()){
          if (keyCode == 80) {
            if (Paused) {
              Resume();
            } else {
              Pause();
            }
          }
          var ship_delta=1;
          switch(keyCode){
            case 37://left
            myomega -= deltaomega;
            break;
            case 39: //right
            myomega += deltaomega;
            break;
            case 40: //down
            myvy += delta_v;
            break;
            case 38: //up
            myvy -= delta_v;
            break;
            case 32:
              fire();
            break;
         }
         
         if (myvx>max_v) {
           myvx = max_v;
         }
         
         if (myvx < -max_v) {
           myvx = -max_v;
         }
         
         if (myvy > max_v) {
           myvy = max_v;
         }
         
         if (myvy < -max_v) {
           myvy = -max_v;
         }
         
         if (myomega > maxomega) {
           myomega = + maxomega;
         }
         
         if (myomega < -maxomega) {
           myomega = - maxomega;
         }
        }
      }

