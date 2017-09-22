$(document).ready(function() {
  starting_menu();

  start();
});

var numberOfStars = 1000;
var numberOfAsteroids = 5;
var redraw_frequency = 20; // target frames per second (FPS); must be > 0

// time step in seconds
var delta_t = 10 / 1000;

const xMin = -10;
const yMin = -10;
const zMin = -10;
const xMax = 10;
const yMax = 10;
const zMax = 10;
const delta_v = 0.1;
const deltaomega = 0.03;
const max_v = 10.0;
const mininimumAsteroidVelocity     = 0.2;
const maximumAsteroidVelocity       = 1.5;
const maximumAsteroidRotationSpeed  = .3;
const minimumTimeBetweenCollissions = 2; // seconds
const maxomega = 3;
const bullet_v0 = -20;
const fire_rate = 2;

// TODO - add more images here ["first.png", "another.png", "aThird.png"]
const asteroidImages = ["atsroid.png"]

var canvas;
var canvasWidth;
var canvasHeight;
var myx, myy, myscale, myangle;
var myvx, myvy, myomega;

myvx = 0;
myvy = 0;
myomega = 0;
myangle = 0;

var keyMap = new Set();

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

class Coordinates3D extends Vector {
  constructor(x = 0, y = 0, z = 0) {
    super();

    this.components = [x, y, z];
  }

  get x() {
    return this.components[0];
  }

  get y() {
    return this.components[1];
  }

  get z() {
    return this.components[2];
  }

  set x(value) {
    this.components[0] = value;
  }

  set y(value) {
    this.components[1] = value;
  }

  set z(value) {
    this.components[2] = value;
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

function canvas_xy(coordinates, myWidth, myHeight) {
  canvas_coordinatees = new Coordinates2D();

  canvas_coordinatees.x = (coordinates.x) * myscale +  canvasWidth / 2;// + myWidth / 2;
  canvas_coordinatees.y = (coordinates.y) * myscale + canvasHeight / 2;// + myWidth / 2;

  return canvas_coordinatees
}

class Velocity2D extends Vector {
  // this is called when you make a new Velocity2D
  constructor(vx = 0, vy = 0) {
    super();

    this.components = [vx, vy];
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

class Star {
  constructor() {
    this.coordinates = new Coordinates3D();
    this.coordinates.x = Math.random() * (xMax - xMin) + xMin;
    this.coordinates.y = Math.random() * (yMax - yMin) + yMin;
    this.coordinates.z = Math.random() * (zMax - zMin) + zMin;
    this.radius = 1;
  }

  get x() {
    return this.coordinates.x;
  }

  get y() {
    return this.coordinates.y;
  }

  get z() {
    return this.coordinates.z;
  }

  set x(value) {
    this.coordinates.x = value;
  }

  set y(value) {
    this.coordinates.y = value;
  }

  set z(value) {
    this.coordinates.z = value;
  }

  moveCoordinates(){
    updateCoordinatesForView(this);

    if (this.x > xMax) {
      this.x -= (xMax - xMin);
    } else if (this.x < xMin) {
      this.x += (xMax - xMin);
    }

    if (this.y > yMax) {
      this.y -= (yMax - yMin);
    } else if (this.y < yMin) {
      this.y += (yMax - yMin);
    }
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
      const center_coordinates = canvas_xy(star.coordinates,2 * star.radius, 2 * star.radius);
      context.beginPath();
      context.arc(center_coordinates.x, center_coordinates.y, star.radius, 0, 2 * Math.PI, false);
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

    universe.detectCollissions();
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

  detectCollissions() {
    // TODO / FIXME - this could really stand to be optimized
    for (let firstEntity of universe.entities) {
      for (let secondEntity of universe.entities) {
        // don't test for collissions with myself
        if (secondEntity == firstEntity) {
          continue;
        }

        Entity2D.detectCollission(firstEntity, secondEntity);
      }
    }
  }

  // start the Universe
  start() {
    this.propagateTimer = setInterval(universe.propagate, delta_t * 1000); // convert delta_t to milliseconds
    this.redrawTimer = setInterval(universe.redraw, 1000 / redraw_frequency);
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
  static distance(a, b) {
    assert(a instanceof Entity2D);
    assert(b instanceof Entity2D);

    return Vector.distance(a.coordinates, b.coordinates);
  }

  static detectCollission(a, b) {
    assert(a instanceof Entity2D);
    assert(b instanceof Entity2D);

    const distance = Entity2D.distance(a, b);
    if (distance < a.radius + b.radius) {
      a.collidedWith(b);
      b.collidedWith(a);
    }
  }

  constructor() {
    this.coordinates = new Coordinates2D(); // initial coordinates
    this.velocity = new Velocity2D();    // initial velocity
    this.image = new Image(); // image for the entity
    this.orientation = 0;     // rotation in radians; 2*PI = 360º (one full turn)
    this.angular_speed = 0;   // rotational speed
    this.lastCollissionAt = (new Date).getTime();

    universe.addEntity(this);
  }

  get radius() {
    return Math.sqrt(Math.pow(this.image.width, 2) + Math.pow(this.image.height, 2)) / myscale / 2 / Math.sqrt(2);
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
      this.orientation               += delta_t * this.angular_speed;
    }
  }

  moveCoordinates() {
    updateCoordinatesForView(this);
  }

  draw(context) {
    const center_coordinates = canvas_xy(this.coordinates, this.image.width, this.image.height);

    context.translate(center_coordinates.x, center_coordinates.y);
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

    context.translate(-center_coordinates.x, -center_coordinates.y);
  }

  collidedWith(otherEntity) {
    const now = (new Date).getTime();

    if (now - this.lastCollissionAt > minimumTimeBetweenCollissions * 1000) {
      this.lastCollissionAt = now;

      this.respondToImpactWith(otherEntity);
    }
  }

  respondToImpactWith(otherEntity) {
    console.log("bang!");
  }
}

class Bullet extends Entity2D {
  constructor() {
    super();

    this.vx = myvx;
    this.vy = myvy + bullet_v0;
    this.orientation = myangle;

    this.image.src = "bullet.png"
  }

  respondToImpactWith(otherEntity) {
    if (otherEntity instanceof Spaceship) {
      return;
    }

    universe.entities.delete(this);
  }
}

class Asteroid extends Entity2D {
  constructor() {
    super(); // run the Entity2D setup

    this.image.src = asteroidImages[Math.floor(Math.random() * asteroidImages.length)];
  }

  respondToImpactWith(otherEntity) {
    if (otherEntity instanceof Asteroid) {
      return; // don't break up on colliding with other asteroids..
    }
    console.log("breakup!");
    asteroid = new Asteroid();
    asteroid.x = this.x;
    asteroid.y = this.y;

    asteroidSpeed = Math.random() * (maximumAsteroidVelocity - mininimumAsteroidVelocity) + mininimumAsteroidVelocity;
    asteroidDirection = Math.random() * 2 * Math.PI;
    asteroid.vx = asteroidSpeed * Math.cos(asteroidDirection);
    asteroid.vy = asteroidSpeed * Math.sin(asteroidDirection);
    asteroid.orientation = Math.PI * 2 * Math.random();
    asteroid.angular_speed = (2 * Math.random() - 1) * maximumAsteroidRotationSpeed
  }

  moveCoordinates() {
    updateCoordinatesForView(this);

    if (this.x > xMax) {
      this.x -= (xMax - xMin);
    } else if (this.x < xMin) {
      this.x += (xMax - xMin);
    }

    if (this.y > yMax) {
      this.y -= (yMax - yMin);
    } else if (this.y < yMin) {
      this.y += (yMax - yMin);
    }
  }
}

class Spaceship extends Entity2D {
  constructor() {
    super();

    this.image.src = "spaceship.png";
  }

  // move the entity forward in time
  propagate() {
  }

  moveCoordinates() {
    this.orientation = myangle;
  }

  respondToImpactWith(otherEntity) {
    if (otherEntity instanceof Bullet) {
      return;
    }
    console.log("explode!");
  }
}

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

  new Spaceship();

  myx = 0;
  myy = 0;
}

function stop() {
  myvx = 0;
  myvy = 0;
  myomega = 0;
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
  bullet = new Bullet();
}

var last_fire = 0;
var bullet_period = 1000 / fire_rate;
// debounced fire limited to once per bullet_period (fire_rate per second)
function fire() {
  current_time = (new Date()).getTime();
  if (current_time - last_fire > bullet_period) {
    throttled_fire();
    last_fire = current_time;
  }
}
