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
    constructor(x, y, width, height, color, dx, dy, mass, max_speed, min_speed, jump_force, move_force_forward, move_force_backward, jumped, alive, health) {
        super(x, y, width, height, color, dx, dy);
        this.mass = mass;
        this.max_speed = max_speed;
        this.min_speed = min_speed;
        this.jump_force = jump_force;
        this.move_force_forward = move_force_forward;
        this.move_force_backward = move_force_backward;
        this.jumped = jumped;
        this.alive = alive;
        this.health = health;
    }

    limit_speed() {
        this.dx = Math.max(Math.min(this.dx, this.max_speed), this.min_speed);
    }

    move(time_delta) {
        this.limit_speed();
        this.x += this.dx * time_delta / 1000;
        this.y += this.dy * time_delta / 1000;
    }

    harm(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.alive = false;
        }
    }

    heal(amount) {
        this.health += amount;
        if (this.health > 100) {
            this.health = 100;
        }
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
    constructor(x, y, width, height, color, dx, dy, mass, max_speed, min_speed, jump_force, move_force_forward, move_force_backward, jumped, alive, health) {
        super(x, y, width, height, color, dx, dy, mass, max_speed, min_speed, jump_force, move_force_forward, move_force_backward, jumped, alive, health);
    }

    limit_location(level) {
        this.x = Math.max(Math.min(this.x, level.x), level.x + level.width - this.width);
        this.y = Math.min(this.y, level.y)
    }

    handle_collisions(level) {
        let vertical_collision = false;
        for (let platform of level.platforms) {
            if (this.check_vertical_collision(platform) && this.dy > 0) {
                this.y = platform.y - this.height;
                this.dy = 0;

                if (!keys["ArrowUp"]) {
                    player.jumped = false;
                }

                vertical_collision = true;
                break;
            }
        }

        if (!vertical_collision) {
            if (!keys["ArrowLeft"] && !keys["ArrowRight"]) {
                this.dx = 0;
            } else if (keys["ArrowLeft"] && keys["ArrowRight"]) {
                this.dx = 0;
            }
        }

        for (let enemy of level.enemies) {
            if (this.check_total_collision(enemy)) {
                this.harm(enemy.harm_amount);
            }
        }
    }

    move(time_delta, level) {
        this.dy += CONSTANTS.physics.gravity * time_delta / 1000;

        if (keys["ArrowLeft"]) {
            this.dx += player.move_force_backward;
        }

        if (keys["ArrowRight"]) {
            this.dx += player.move_force_forward;
        }

        if (keys["ArrowUp"] && !player.jumped) {
            this.dy += player.jump_force;
            player.jumped = true;
        }

        if (keys.ArrowRight) {
            this.dx += this.move_force_forward
        }

        this.handle_collisions(level);
        this.limit_speed();
        this.x += this.dx * time_delta / 1000;
        this.y += this.dy * time_delta / 1000;

        this.limit_location(level);
    }
}

class Enemy extends LivingSprite {
    constructor(x, y, width, height, color, dx, dy, mass, max_speed, min_speed, jump_force, move_force_forward, move_force_backward, jumped, alive, health, harm_amount) {
        super(x, y, width, height, color, dx, dy, mass, max_speed, min_speed, jump_force, move_force_forward, move_force_backward, jumped, alive, health);

        this.harm_amount = harm_amount;
    }
}

class Level {
    constructor(platforms, enemies, x, y, width, height) {
        this.platforms = platforms;
        this.enemies = enemies;

        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    get_html() {
        let html = "";
        for (let i = 0; i < this.platforms.length; i++) {
            let platform = this.platforms[i];
            html += platform.get_html();
        }

        for (let i = 0; i < this.enemies.length; i++) {
            let enemy = this.enemies[i];
            html += enemy.get_html();
        }

        return html;
    }

    add_platform(platform) {
        this.platforms.push(platform);
    }

    add_enemy(enemy) {
        this.enemies.push(enemy);
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

// Key Handling
keys = {
    "ArrowUp": false,
    "ArrowDown": false,
    "ArrowLeft": false,
    "ArrowRight": false,
};

window.addEventListener(
    "keydown",
    function (e) {
        keys[e.key] = true;
    }
);

window.addEventListener(
    "keyup",
    function (e) {
        keys[e.key] = false;
    }
);

let player = new Player(
    1,
    1,
    .52,
    .52,
    "blue",
    0,
    0,
    64,
    6,
    -6,
    -5,
    .2,
    -.2,
    false,
    true,
    100,
);

let level_1 = new Level(
    [
        new Sprite(0, 7, 100, .2, "red", -.5, 0),
        new Sprite(4, 6, 2, .1, "red", -.5, 0),
    ],
    [
        new Enemy(
            2,
            6.7,
            .52,
            .3,
            "black",
            -.25,
            0,
            64,
            6,
            -6,
            -5,
            .2,
            -.2,
            false,
            true,
            100,
            100,
        ),
    ]
);

function draw(player, level) {
    let html = "";
    html += level.get_html();
    html += player.get_html();

    try {
        document.getElementById("game").innerHTML = html;
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
        for (let i = 0; i < level.enemies.length; i++) {
            let enemy = level.enemies[i];
            if (
                player.check_total_collision(enemy)
            ) {
                player.alive = false;
                break;
            }
        }

        // Get key dx dy
        let dx = 0;
        let dy = 0;

        if (keys["ArrowLeft"]) {
            dx += player.move_force_backward;
        }

        if (keys["ArrowRight"]) {
            dx += player.move_force_forward;
        }

        if (keys["ArrowUp"] && !player.jumped) {
            dy += player.jump_force;
            player.jumped = true;
        }


        // Calculate dx dy
        dx += player.dx;
        dy += player.dy;

        // Check vertical collision
        let vertical_collision = false;
        for (let i = 0; i < level.platforms.length; i++) {
            let platform = level.platforms[i];
            if (
                player.check_vertical_collision(platform) && dy >= 0
            ) {
                vertical_collision = true;
                if (!keys["ArrowUp"]) {
                    player.jumped = false;
                }
                break;
            }
        }

        if (vertical_collision) {
            if (!keys["ArrowLeft"] && !keys["ArrowRight"]) {
                dx = 0;
            } else if (keys["ArrowLeft"] && keys["ArrowRight"]) {
                dx = 0;
            }
        }

        if (vertical_collision && dy >= 0) {
            dy = 0;
        } else {
            dy += CONSTANTS.physics.gravity * delta_time / 1000;
        }

        dx = Math.min(dx, player.max_speed);
        dx = Math.max(dx, player.min_speed);
        dy = Math.min(dy, player.max_speed);
        dy = Math.max(dy, player.min_speed);

        // Calculate x y
        let x = player.x + dx * delta_time / 1000;
        let y = player.y + dy * delta_time / 1000;

        y = Math.min(y, 7 - player.height)

        player.x = x;
        player.y = y;
        player.dx = dx;
        player.dy = dy;

        for (let i = 0; i < level.enemies.length; i++) {
            let enemy = level.enemies[i];
            enemy.x += enemy.dx * delta_time / 1000;
            enemy.y += enemy.dy * delta_time / 1000;
        }

        for (let i = 0; i < level.platforms.length; i++) {
            let platform = level.platforms[i];
            console.log(platform.dx * delta_time / 1000);
            platform.x += platform.dx * delta_time / 1000;
            platform.y += platform.dy * delta_time / 1000;
        }

        game_properties.last_update_time = timestamp;
        draw(player, level);
    }

    if (player.alive) {
        level_loop.bind(this, player, level)
        requestAnimationFrame(() => level_loop(player, level));
    } else {
        console.log("Game over");
    }
}

function main() {
    level_loop(player, level_1);
}

main();
