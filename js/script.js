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
            left: ${this.x * pixels_per_meter}px; 
            top: ${this.y * pixels_per_meter}px; 
            width: ${this.width * pixels_per_meter}px; 
            height: ${this.height * pixels_per_meter}px; 
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
}

class Level {
    constructor(platforms, enemies) {
        this.platforms = platforms;
        this.enemies = enemies;
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
}

// Basic platformer game

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

let jumped = false;

let last_update_time = 0;

let game = document.getElementById("game");

let gravity = 9.8;

let pixels_per_meter = 100;

let player = {
    sprite: new Sprite(1, 1, .52, 1.7, "blue", 0, 0),
    mass: 64,
    dx: 0,
    dy: 0,
    max_speed: 6,
    min_speed: -6,
    jump_force: -5,
    move_force_forward: .2,
    move_force_backward: -.2,
    alive: true,
};

let level_1 = new Level(
    [
        new Sprite(0, 7, 100, .2, "red", -.5, 0),
        new Sprite(4, 6, 2, .1, "red", -.5, 0),
    ],
    [
        new Sprite(2, 6.7, .52, .3, "black", -.5, 0),
    ]
);

function draw(player, level) {
    let html = "";

    html += level.get_html();

    html += player.sprite.get_html();

    try {
        document.getElementById("game").innerHTML = html;
    } catch (e) {}
}

function level_loop(player, level) {
    let timestamp = Date.now();
    let delta_time = 0;

    if (last_update_time === 0) {
        last_update_time = timestamp;
    } else {
        delta_time = timestamp - last_update_time;
    }

    if (delta_time > 1000 / 80) {
        // Check enemy collision
        for (let i = 0; i < level.enemies.length; i++) {
            let enemy = level.enemies[i];
            if (
                player.sprite.check_total_collision(enemy)
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

        if (keys["ArrowUp"] && !jumped) {
            dy += player.jump_force;
            jumped = true;
        }


        // Calculate dx dy
        dx += player.dx;
        dy += player.dy;

        // Check vertical collision
        let vertical_collision = false;
        for (let i = 0; i < level.platforms.length; i++) {
            let platform = level.platforms[i];
            if (
                player.sprite.check_vertical_collision(platform) && dy >= 0
            ) {
                vertical_collision = true;
                if (!keys["ArrowUp"]) {
                    jumped = false;
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
            dy += gravity * delta_time / 1000;
        }

        dx = Math.min(dx, player.max_speed);
        dx = Math.max(dx, player.min_speed);
        dy = Math.min(dy, player.max_speed);
        dy = Math.max(dy, player.min_speed);

        // Calculate x y
        let x = player.sprite.x + dx * delta_time / 1000;
        let y = player.sprite.y + dy * delta_time / 1000;

        y = Math.min(y, 7 - player.sprite.height)

        player.sprite.x = x;
        player.sprite.y = y;
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

        last_update_time = timestamp;
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
