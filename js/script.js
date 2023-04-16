class Sprite {
    constructor(x, y, width, height, color, dx, dy) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;

        this.dx = dx;
        this.dy = dy;
    }

    get_html() {
        return `<div style="
            position: absolute; 
            left: ${this.x * CONSTANTS.graphics.pixels_per_meter}px;
            top: ${this.y * CONSTANTS.graphics.pixels_per_meter}px;
            width: ${this.width * CONSTANTS.graphics.pixels_per_meter}px;
            height: ${this.height * CONSTANTS.graphics.pixels_per_meter}px; 
            background-color: ${this.color};
        "></div>`;
    }

    check_total_collision(other) { // Returns true if the two sprites are touching
        return (
            (this.x <= other.x + other.width) && (other.x <= (this.x + this.width)) &&
            (this.y <= other.y + other.height) && (other.y <= (this.y + this.height))
        );
    }

    check_vertical_collision(other) { // Returns true if this sprite is on top of the other sprite
        return this.check_total_collision(other) && (this.y + this.height <= other.y + other.height);
    }

    move(time_delta) {
        this.x += this.dx * time_delta / 1000;
        this.y += this.dy * time_delta / 1000;
    }
}

class LivingSprite extends Sprite {
    constructor(x, y, width, height, color, dy, jump_force, jumped, alive) {
        super(x, y, width, height, color, 0, dy);
        this.jump_force = jump_force;
        this.jumped = jumped;
        this.alive = alive;
    }

    move(time_delta) {
        this.y += this.dy * time_delta / 1000;
    }

    get_html() {
        return `<div style="
            position: absolute; 
            left: ${this.x * CONSTANTS.graphics.pixels_per_meter}px;
            top: ${this.y * CONSTANTS.graphics.pixels_per_meter}px;
            width: ${this.width * CONSTANTS.graphics.pixels_per_meter}px;
            height: ${this.height * CONSTANTS.graphics.pixels_per_meter}px; 
            background-color: ${this.color};
        "></div>`;
    }
}

class Player extends LivingSprite {
    constructor(x, y, width, height, color, dy, max_dy, jump_force, jumped, alive) {
        super(x, y, width, height, color, dy, jump_force, jumped, alive);
        this.max_dy = max_dy;
        this.score = 0;
    }

    limit_speed() {
        this.dy = Math.max(this.dy, this.max_dy);
    }

    limit_location(level) {
        this.y = Math.max(this.y, level.y);
        if (this.y === level.y) {
            this.dy = 0;
        }
    }

    handle_collisions(level) {
        if (this.check_total_collision(level.base_platform)) {
            this.alive = false;
        }

        for (let pipe of level.pipes) {
            for (let pipe_sprite of pipe.pipes) {
                if (this.check_total_collision(pipe_sprite)) {
                    this.alive = false;
                }
            }

            if (this.check_total_collision(pipe.scoring_block) && !pipe.scoring_block.scored && this.alive) {
                this.score += 1;
                pipe.scoring_block.scored = true;
            }
        }
    }

    move(time_delta, level) {
        this.dy += CONSTANTS.physics.gravity * time_delta / 1000;

        this.limit_speed();
        this.handle_collisions(level);
        this.y += this.dy * time_delta / 1000;

        this.limit_location(level);
    }
}

class ScoringBlock extends Sprite {
    constructor(x, y, width, height) {
        super(x, y, width, height, "red", -2, 0);
        this.scored = false;
    }
}

class Pipe {
    constructor(x, y, gap_y, gap_height) {
        this.x = x;
        this.y = y;

        this.pipes = [
            new Sprite(x, y, .2, gap_y, "green", -2, 0),
            new Sprite(x, gap_y + gap_height, .2, 100 - gap_y - gap_height, "green", -2, 0)
        ];

        this.scoring_block = new ScoringBlock(x, gap_y, .2, gap_height);
    }

    get_html() {
        let html = "";
        for (let i = 0; i < this.pipes.length; i++) {
            let pipe = this.pipes[i];
            html += pipe.get_html();
        }

        return html;
    }

    move(time_delta) {
        for (let i = 0; i < this.pipes.length; i++) {
            let pipe = this.pipes[i];
            pipe.move(time_delta);
        }

        this.scoring_block.move(time_delta);

        return (this.pipes[0].x < 0)
    }
}

class Level {
    constructor(pipes, x, y, width, height) {
        this.base_platform = new Sprite(x, y + height, width, .1, "black", 0, 0);
        this.pipes = pipes;

        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    get_html() {
        let html = "";

        html += this.base_platform.get_html();

        for (let pipe of this.pipes) {
            html += pipe.get_html();
        }

        return html;
    }
}

const CONSTANTS = {
    physics: {
        gravity: 9.8,
    },
    graphics: {
        pixels_per_meter: 100,
    },
}

let game_properties = {
    last_update_time: 0,
}

let player = new Player(
    0,
    0,
    .5,
    .5,
    "blue",
    0,
    -5,
    -5,
    5,
    true,
);

function gen_level(width, height) {
    let pipes = [];

    for (let i = 10; i < width; i+=3) {
        let pipe = new Pipe(
            i,
            0,
            Math.random() * height / 2,
            2,
        );

        pipes.push(pipe);
    }

    return new Level(
        pipes,
        0,
        0,
        width,
        height,
    );
}

let infinite_level = gen_level(100, 7);


function draw(player, level) {
    let html = "";
    html += level.get_html();
    html += player.get_html();

    try {
        document.getElementById("game").innerHTML = html;
    } catch (e) {}

    if (player.score > high_score) {
        high_score = player.score;
    }

    try {
            document.getElementById("score").innerHTML = "Score: " + player.score + "<br>High Score: " + high_score;
    } catch (e) {}
}

function level_loop(player, level) {
    let timestamp = Date.now();
    let delta_time = 0;

    if (game_properties.last_update_time === 0) {
        game_properties.last_update_time = timestamp;
    } else {
        delta_time = timestamp - game_properties.last_update_time;
    }

    if (delta_time > 1000 / 80) {
        // Check enemy collision
        player.move(delta_time, level);
        level.base_platform.move(delta_time);

        let destroy = false;

        for (let pipe of level.pipes) {
            if (pipe.move(delta_time)) {
                destroy = true;
            }
        }

        if (destroy) {
            level.pipes.shift();
            console.log(level.pipes.slice(-1)[0])
            level.pipes.push(new Pipe(
                level.pipes.slice(-1)[0].pipes[0].x + 3,
                0,
                Math.random() * level.height / 2,
                2,
            ));
        }

        game_properties.last_update_time = timestamp;
        draw(player, level);
    }

    if (player.alive) {
        level_loop.bind(this, player, level)
        requestAnimationFrame(() => level_loop(player, level));
    } else {
        if (!high_score || high_score <= player.score) {
            localStorage.setItem("high_score", player.score.toString());
        }
        try {
            document.getElementById("score").innerHTML =
                "Score: " + player.score + "<br>High Score: " + high_score + "<br>Game Over" + "<br>Reload to play again";
        } catch (e) {}
    }
}


let high_score = localStorage.getItem("high_score");
if (high_score === null) {
    high_score = 0;
}

window.addEventListener(
    "keydown",
    function (e) {
        if (!player.jumped) {
            player.dy += player.jump_force;
            player.jumped = true;
        }
    }
);

window.addEventListener(
    "keyup",
    function (e) {
        player.jumped = false;
    }
);

window.addEventListener(
    "mousedown",
    function (e) {
        if (!player.jumped) {
            player.dy += player.jump_force;
            player.jumped = true;
        }
    }
);

window.addEventListener(
    "mouseup",
    function (e) {
        player.jumped = false;
    }
);

window.addEventListener(
    "touchstart",
    function (e) {
        if (!player.jumped) {
            player.dy += player.jump_force;
            player.jumped = true;
        }
    }
);

window.addEventListener(
    "touchend",
    function (e) {
        player.jumped = false;
    }
);

level_loop(player, infinite_level);
