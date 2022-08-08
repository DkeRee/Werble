//Main Constants
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;

canvas.width = WIDTH;
canvas.height = HEIGHT;

const deltaTime = 1 / 60;
var accTime = 0;
var lastTime = 0;

class xy {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
}

function radian(angle) {
	return (angle * Math.PI) / 180;
}

function ballCollision(ballOne, ballTwo) {
	const distX = ballOne.x - ballTwo.x;
	const distY = ballOne.y - ballTwo.y;
	const dist = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));

	if (dist < (ballOne.radius + ballTwo.radius)) {
		//collided
		return true;
	} else {
		//didn't collide :(
		return false;
	}
}

function dotProduct(vectorOne, vectorTwo) {
	return vectorOne.x * vectorTwo.x + vectorOne.y + vectorTwo.y;
}

function reboundingAway(ballOne, ballTwo) {
	if (ballOne.velocity == 0 || ballTwo.velocity == 0) {
		//if velocity for either ball is 0 let it bounce regardless
		return false;
	} else {
		//else do dot product calculations
		const ballOneVector = new xy(Math.cos(ballOne.angle), Math.sin(ballOne.angle));
		const ballTwoVector = new xy(Math.cos(ballTwo.angle), Math.sin(ballTwo.angle));

		return dotProduct(ballOneVector, ballTwoVector) > 0 ? false : true;
	}
}

const mouseBall = {
	prevX: canvas.width / 2,
	prevY: canvas.height / 2,
	x: canvas.width / 2,
	y: canvas.height / 2,
	velocity: 0,
	radius: 40,
	color: "rgba(254, 231, 92, 0.6)",
	update: function() {
		//update velocity to how fast the mouse is moving
		this.velocity = Math.sqrt(Math.pow(this.x - this.prevX, 2) + Math.pow(this.y - this.prevY, 2));

		//update prev coords to current ones
		this.prevX = this.x;
		this.prevY = this.y;
	},
	render: function() {
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
		ctx.fill();
	}
};

var balls = [];

window.onresize = function(){
	WIDTH = window.innerWidth;
	HEIGHT = window.innerHeight;
	canvas.width = WIDTH;
	canvas.height = HEIGHT;
	balls = [];
	initBalls();
};

class Ball {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.radius = 15;
		this.velocity = 50;
		this.angle = radian(Math.floor(Math.random() * 360));
		this.id = Math.floor(Math.random() * 100000);

		this.possibleColors = ["#ED4245", "#FFA500", "#DEC951", "#3AB02E", "#224ACF", "#934A9E"];
		this.color = this.possibleColors[Math.floor(Math.random() * this.possibleColors.length)];
	}

	addVelocity(throttle) {
		if (this.velocity < 100) {
			this.velocity += throttle;
		}
	}

	update() {
		//check if ball hits barrier
		const negX = this.x - this.radius;
		const posX = this.x + this.radius;

		const negY = this.y - this.radius;
		const posY = this.y + this.radius;

		//left or right wall
		if (negX <= 0 || posX >= WIDTH) {
			this.angle = radian(180) - this.angle;

			this.addVelocity(30);
		}

		//top or bottom wall
		if (negY <= 0 || posY >= HEIGHT) {
			this.angle = radian(360) - this.angle;

			this.addVelocity(30);
		}

		//other balls
		for (var i = 0; i < balls.length; i++) {
			//this ball is not me
			if (balls[i].id !== this.id) {
				const otherBall = balls[i];

				//if colliding && isn't rebounding away
				if (ballCollision(this, otherBall) && !reboundingAway(this, otherBall)) {
					//reset rebound angle if velocity is 0
					if (this.velocity == 0 || otherBall.velocity == 0) {
						const fluid = this.velocity !== 0 ? this : otherBall;
						const stationary = this.velocity == 0 ? this : otherBall;

						//set static's angle to counter fluid's
						stationary.angle = fluid.angle + radian(180);
						stationary.angle %= radian(360);
						stationary.addVelocity(stationary.radius);
					}

					//update directions
					this.angle = this.angle + otherBall.angle;
					this.angle %= radian(360);

					otherBall.angle = this.angle - otherBall.angle;
					otherBall.angle %= radian(360);

					//update velocities
					const max = this.velocity >= otherBall.velocity ? this : otherBall;
					const min = this.velocity <= otherBall.velocity ? this : otherBall;

					const lever = (max.velocity / 5);

					//diminish max's velocity
					max.velocity -= lever;

					//increase min's velocity
					min.addVelocity(lever);
				}
			}
		}

		//mouse ball

		//if colliding
		if (ballCollision(this, mouseBall)) {
			this.angle = Math.atan2(this.y - mouseBall.y, this.x - mouseBall.x);

			//add velocity based on speed of mouse
			this.addVelocity(30 * mouseBall.velocity);
		}

		//update angle
		this.angle %= radian(360);

		//update x and y based on velocity
		this.x += Math.cos(this.angle) * this.velocity * deltaTime;
		this.y += Math.sin(this.angle) * this.velocity * deltaTime;

		//update velocity
		if (this.velocity <= 0) {
			this.velocity = 0;
		} else {
			this.velocity -= deltaTime * 300;
		}
	}

	render() {
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
		ctx.fill();
	}
}

function initBalls() {
	//init 100 balls
	for (var i = 0; i < 100; i++) {
		const randX = Math.floor(Math.random() * WIDTH / 1.05) + 10;
		const randY = Math.floor(Math.random() * HEIGHT / 1.05) + 10;

		balls.push(new Ball(randX, randY));
	}
}

initBalls();

//Main Animation Loop
function step(time) {
	accTime += (time - lastTime) / 1000;

	while (accTime > deltaTime) {
		if (accTime > 1) {
			accTime = deltaTime;
		}

		update();
		accTime -= deltaTime;
	}
	lastTime = time;
	render();
	requestAnimationFrame(step);
}
requestAnimationFrame(step);

function update() {
	//update balls
	for (var i = 0; i < balls.length; i++) {
		balls[i].update();
	}

	//update mouseBall
	mouseBall.update();
}

function render() {
	//clear background
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	//set background
	ctx.fillStyle = "#2C2F33";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	//render mouseBall
	mouseBall.render();

	//render balls
	for (var i = 0; i < balls.length; i++) {
		balls[i].render();
	}
}

//Event Listener
canvas.addEventListener("mousemove", e => {
	const rect = canvas.getBoundingClientRect();
	mouseBall.x = e.clientX - rect.left;
	mouseBall.y = e.clientY - rect.top;
});