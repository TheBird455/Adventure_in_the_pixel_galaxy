$(document).ready(function() {
  starting_menu();

  start();
});

var numberOfStars = 400;
var numberOfAsteroids = 5;
var redraw_frequency = 20; // target frames per second (FPS)

myvx = 0;
myvy = 0;
myomega = 0;
myangle = 0;

// time step in seconds
var delta_t = 10 / 1000;

var xMin = -10;
var yMin = -10;
var xMax = 10;
var yMax = 10;
var delta_v = 0.1;
var deltaomega = 0.03;
var max_v = 10.0;
var mininimumAsteroidVelocity    = 0.2;
var maximumAsteroidVelocity      = 1.5;
var maximumAsteroidRotationSpeed = .3;
var maxomega = 3;
var bullet_v0 = -20;
var fire_rate = 2;
var spaceShipImage;
var canvas;
var canvasWidth;
var canvasHeight;
var myx, myy, myscale, myangle;
var myvx, myvy, myomega;

var keyMap = new Set();

// TODO / FIXME - refactor these to Universe or perhaps View
function canvasx(x, y, myWidth, myHeight) {
  return (x) * myscale + canvasWidth / 2;// + myWidth / 2;
}

function canvasy(x, y, myWidth, myHeight) {
  return (y) * myscale+ canvasHeight / 2;// + myHeight / 2;
}

function updateCoordinatesForView(entity) {
  entity.x -= myvx * delta_t;
  entity.y -= myvy * delta_t;
  delta_angle = myomega * delta_t;

  next_x =  entity.x * Math.cos(delta_angle) + entity.y * Math.sin(delta_angle);
  next_y = -entity.x * Math.sin(delta_angle) + entity.y * Math.cos(delta_angle);
  entity.x = next_x;
  entity.y = next_y;

  next_vx =  entity.vx * Math.cos(delta_angle) + entity.vy * Math.sin(delta_angle);
  next_vy = -entity.vx * Math.sin(delta_angle) + entity.vy * Math.cos(delta_angle);

  entity.vx = next_vx;
  entity.vy = next_vy;
}

// ECMAScript doesn't have an assert keyword yet..
function assert(value) {
  if (value) {
    return;
  }

  console.trace();
  throw "assert failed"
}

const Difficulty = {
  EASY: 0,
  NORMAL: 1,
  HARD: 2,
}

class Settings {
  constructor() {

  }

  setDifficulty(difficulty) {
    this._difficulty = difficulty;
    $("#difficulty_menu a").removeClass("selected");
    switch (difficulty) {
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

// a generic Vector class for holding vectors and doing math with them
class Vector {
  constructor(dimensions) {
    this.components = new Array(dimensions);
  }

  get dimensions() {
    return this.components.length;
  }

  // get the distance between two vectors
  static distance(a, b) {
    // make sure we can do this..
    assert(a instanceof Vector);
    assert(b instanceof Vector);

    const dimensions = a.dimensions;
    assert(dimensions == b.dimensions);

    var sumOfSquaredDistances = 0.0;
    for (var i=0;i<dimensions;i++) {
      sumOfSquaredDistances += Math.pow(a.components[i] - b.components[i], 2);
    }

    return Math.sqrt(sumOfSquaredDistances);
  }
}

class Coordinates2D extends Vector {
  // this is called when you make a new Coordinates2D
  constructor(x = 0, y = 0) {
    super();

    this.components = [x, y];
  }

  get x() {
    return this.components[0];
  }

  get y() {
    return this.components[1];
  }

  set x(value) {
    this.components[0] = value;
  }

  set y(value) {
    this.components[1] = value;
  }
}

class Velocity2D extends Vector {
  // this is called when you make a new Velocity2D
  constructor(vx = 0, vy = 0) {
    super();

    this.components = [vx, vy];
  }

  //
  get x() {
    return this.components[0];
  }

  get y() {
    return this.components[1];
  }

  set x(value) {
    this.components[0] = value;
  }

  set y(value) {
    this.components[1] = value;
  }
}

class Star {
  constructor() {
    this.coordinates = new Coordinates2D();
    this.coordinates.x = Math.random() * (xMax - xMin) + xMin;
    this.coordinates.y = Math.random() * (yMax - yMin) + yMin;
    this.radius = 1;
  }

  get x() {
    return this.coordinates.x;
  }

  get y() {
    return this.coordinates.y;
  }

  set x(value) {
    this.coordinates.x = value;
  }

  set y(value) {
    this.coordinates.y = value;
  }

  moveCoordinates(){
    updateCoordinatesForView(this);
  }
}

class Starfield  {
  constructor() {
    this.stars = new Set()

    for (var i=0;i<numberOfStars;i++) {
      this.stars.add(new Star());
    }
  }

  draw(context) {
    this.stars.forEach(function(star) {
      const centerx = canvasx(star.x, star.y, 2 * star.radius, 2 * star.radius);
      const centery = canvasy(star.x, star.y, 2 * star.radius, 2 * star.radius);
      context.beginPath();
      context.arc(centerx, centery, star.radius, 0, 2 * Math.PI, false);
      context.strokeStyle = "#888";
      context.stroke();
    });
  }

  moveCoordinates() {
    this.stars.forEach(function(star) {
      star.moveCoordinates();
    });
  }
}

function keyHandler() {
  for (let keyCode of keyMap.values()) {
    if (keyCode == 80) {
      if (Paused) {
        Resume();
      } else {
        Pause();
      }
    }

    switch (keyCode) {
      case 37: //left
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
      case 88:
        stop();
        break;
    }

    if (myvx > max_v) {
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
      myomega = +maxomega;
    }

    if (myomega < -maxomega) {
      myomega = -maxomega;
    }
  }
}

// TODO / FIXME - make Universe a singleton
class Universe {
  constructor() {
    this.starfield = new Starfield();
    this.entities = new Set();
  }

  addEntity(entity) {
    this.entities.add(entity);
  }

  removeEntity(entity) {
    this.entities.delete(entity);
  }

  propagate() {
    // move the Universe forward in time
    keyHandler();
    myangle += myomega * delta_t;

    universe.starfield.moveCoordinates();

    universe.entities.forEach(function(entity){
      entity.propagate();
      entity.moveCoordinates();
    });
  }

  redraw() {
    canvasWidth = canvas.width();
    canvasHeight = canvas.height();
    canvas.attr("width", canvasWidth);
    canvas.attr("height", canvasHeight);
    myscale = canvasWidth / (xMax - xMin);
    var context = canvas.get(0).getContext("2d");
    context.imageSmoothingEnabled = false;

    universe.starfield.draw(context);

    universe.entities.forEach(function(entity) {
      entity.draw(context);
    });
  }

  // start the Universe
  start() {
    this.propagateTimer = setInterval(universe.propagate, delta_t * 1000); // convert delta_t to milliseconds
    this.redrawTimer = setInterval(universe.redraw, redraw_delta_t);
  }

  // end the Universe; stop timers and remove all entities
  end() {
    clearInterval(this.propagate_timer);

    for (let entity of this.entities) {
      this.removeEntity(entity);
    }
  }
}

var universe = new Universe();

// an Entity is anything that exists within the game
// examples include ships, planets, asteroids, bullets, etc.
class Entity2D {
  constructor() {
    this.coordinates = new Coordinates2D(); // initial coordinates
    this.velocity = new Velocity2D();    // initial velocity
    this.image = new Image(); // image for the entity
    this.orientation = 0;     // rotation in radians; 2*PI = 360º (one full turn)
    this.angular_speed = 0;   // rotational speed

    universe.addEntity(this);
  }

  get dimensions() {
    return this.coordinates.dimensions;
  }

  get x() {
    return this.coordinates.x;
  }

  get y() {
    return this.coordinates.y;
  }

  set x(value) {
    this.coordinates.x = value;
  }

  set y(value) {
    this.coordinates.y = value;
  }

  get vx() {
    return this.velocity.x;
  }

  get vy() {
    return this.velocity.y;
  }

  set vx(value) {
    this.velocity.x = value;
  }

  set vy(value) {
    this.velocity.y = value;
  }

  // move the entity forward in time
  propagate() {
    for (var i=0;i<this.dimensions;i++) {
      this.coordinates.components[i] += delta_t * this.velocity.components[i];
      this.orientation    += delta_t * this.angular_speed;
    }
  }

  moveCoordinates() {
    updateCoordinatesForView(this);
  }

  draw(context) {
    const centerx = canvasx(this.x, this.y, this.image.width, this.image.height);
    const centery = canvasy(this.x, this.y, this.image.width, this.image.height);

    context.translate(centerx, centery);
    context.rotate(-myangle);
    context.rotate(this.orientation);
    context.translate(-this.image.width/2, -this.image.height/2);
    context.drawImage(
      this.image,
      0,
      0);
    context.translate(this.image.width/2, this.image.height/2);
    context.rotate(-this.orientation);
    context.rotate(myangle);

    context.translate(-centerx, -centery);
  }
}

class Asteroid extends Entity2D {
  constructor() {
    super(); // run the Entity2D setup

    // TODO / FIXME - randomly place and orient this Asteroid, and randomly select from one of several images
    this.image.src = "atsroid.png";
  }
}

var bulletImage;
// todo rotate

var bulletCoordinates = [];
var bulletVelocities = [];
var bulletOrientations = [];
var asteroidCoordinates = [];
var asteroidVelocities = [];
var asteroidOrientations = [];
var asteroidRotations = [];

// TODO star colors and size
function start() {
  settings.setDifficulty(Difficulty.NORMAL);
  canvas = $("canvas");

  // generate the initial asteroids
  for (var i=0;i<numberOfAsteroids;i++) {
    asteroid = new Asteroid();
    asteroid.x = (xMax - xMin) * Math.random() + xMin;
    asteroid.y = (yMax - yMin) * Math.random() + yMin;

    asteroidSpeed = Math.random() * (maximumAsteroidVelocity - mininimumAsteroidVelocity) + mininimumAsteroidVelocity;
    asteroidDirection = Math.random() * 2 * Math.PI;
    asteroid.vx = asteroidSpeed * Math.cos(asteroidDirection);
    asteroid.vy = asteroidSpeed * Math.sin(asteroidDirection);

    asteroid.orientation = Math.PI * 2 * Math.random();
    asteroid.angular_speed = (2 * Math.random() - 1) * maximumAsteroidRotationSpeed
  }

  myx = 0;
  myy = 0;
  spaceShipImage = new Image();
  spaceShipImage.src = "spaceship.png";

  bulletImage = new Image();
  bulletImage.src = "bullet.png";
}

function stop() {
  myvx = 0;
  myvy = 0;
  myomega = 0;
}

function imageRadius(image){
  return Math.sqrt(Math.pow(image.width,2) + Math.pow(image.height,2));
}

var lastCollission = 0;

function explode() {
  now = (new Date).getTime();

  if (now - lastCollission > 5) {
    alert("bang bang you're dead!");
    lastCollission = now;
  }
}

function detectCollision(firstCoordinates, firstOrientation, firstImage, secondCoordinates, secondOrientation, secondImage){
  firstRadius = imageRadius(firstImage);
  secondRadius = imageRadius(secondImage);

  firstx  = canvasx(firstCoordinates[0], firstCoordinates[1], firstImage.width, firstImage.height) + firstImage.width/2;
  firsty  = canvasy(firstCoordinates[0], firstCoordinates[1], firstImage.width, firstImage.height) + firstImage.height/2;

  secondx = canvasx(secondCoordinates[0], secondCoordinates[1], secondImage.width, secondImage.height) + secondImage.width/2;
  secondy = canvasy(secondCoordinates[0], secondCoordinates[1], secondImage.width, secondImage.height) + secondImage.height/2;

    distance = myscale*Math.sqrt(Math.pow(firstx - secondx,2) + Math.pow(firsty - secondy,2));
    if ((distance < firstRadius + secondRadius)){
      explode();
      console.log(firstCoordinates, secondCoordinates, firstRadius, secondRadius, distance);
    }
}

function detectCollisions(){
  for (i = 0; i < asteroidCoordinates.length; i++) {
    asteroidXY = asteroidCoordinates[i];
    asteroidOrientation = asteroidOrientations[i];
    for (j = 0; j < bulletCoordinates.length; j++) {
    bulletXY = bulletCoordinates[j];
    bulletOrientation = bulletOrientations[j];
    detectCollision(asteroidXY, asteroidOrientation, asteroidImage, bulletXY, bulletOrientation, bulletImage);
    }
  }
}

function nextVelocities(vx, vy) {
  delta_angle = myomega * (delta_t);
  next_vx =  vx * Math.cos(delta_angle) + vy * Math.sin(delta_angle);
  next_vy = -vx * Math.sin(delta_angle) + vy * Math.cos(delta_angle);

  return [next_vx, next_vy];
}

function starting_menu() {
  $("#start").click(function(event) {
    $("#start_menu").toggle();
  });

  $("#new_game").click(function(event) {
    new_game();
  });

  $("#options").click(function(event) {
    $("#option_menu").toggle();
  });

  $("#difficulty").click(function(event) {
    $("#difficulty_menu").toggle();
  });

  $("#easy").click(function(event) {
    settings.setDifficulty(Difficulty.EASY);
  });

  $("#normal").click(function(event) {
    settings.setDifficulty(Difficulty.NORMAL);
  });

  $("#hard").click(function(event) {
    settings.setDifficulty(Difficulty.HARD);
  });
}

var redraw_delta_t = 50;

function new_game() {
  $("#starting_menu").hide();
  $("#GameCanvas").show();
  $("#title").hide();
  $("#music1")[0].pause();
  $("body").css("background-image", "none");
  $("body").css("background", "black");

  $(document).keyup(function(event) {
    keyMap.delete(event.keyCode);
  });
  $(document).keydown(function(event) {
    keyMap.add(event.keyCode);
  });

  universe.start();
}

function propagate() {
  keyHandler();
  moveCoordinates();
  cleanUpBullets();

}

function throttled_fire() {
  bulletCoordinates.push([0, 0]);
  bulletVelocities.push([myvx, myvy + bullet_v0]);
  bulletOrientations.push(myangle);
}

var last_fire = 0;
var bullet_period = 1000 / fire_rate;

function fire() {
  current_time = (new Date()).getTime();
  if (current_time - last_fire > bullet_period) {
    throttled_fire();
    last_fire = current_time;
  }
}
