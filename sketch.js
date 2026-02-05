let trees = [];
let grasses = [];
let petals = [];
let state = 'start';
let seedImg;
let clearBtn;
let aboutBtn;
let previousState = 'start';
let circleSize = 280;
let aboutReturnY = 0;


function preload() {
    seedImg = loadImage('seed.png');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    imageMode(CENTER);
    noCursor();
    setupMic();

    //button
    clearBtn = createButton('clear');
    clearBtn.position(width - 85, height - 50);
    clearBtn.class('tree-btn');
    clearBtn.hide();

    //about button
    aboutBtn = createButton('About');
    aboutBtn.position(15, height - 50);
    aboutBtn.class('tree-btn');
}

function draw() {
    if (state === 'start') {
        drawStartPage();
    } else if (state === 'about') {
        drawAboutPage();
    } else {
        drawTreePage();
    }
}


function drawStartPage() {
    colorMode(RGB);
    background(255, 235, 240);

    let d = dist(mouseX, mouseY, width / 2, height / 2);

    //pink circle
    let targetSize = d < 180 ? 380 : 280;
    circleSize = lerp(circleSize, targetSize, 0.1);
    drawingContext.filter = 'blur(40px)';
    noStroke();
    fill(230, 80, 120);
    ellipse(width / 2, height / 2, circleSize, circleSize);
    drawingContext.filter = 'none';

    fill(255);
    textAlign(CENTER, CENTER);
    textFont('Barriecito');

    if (d < 180) {
        textSize(16);
        text('click anywhere to plant a tree', width / 2, height / 2);
    } else {
        textSize(28);
        text('PLANT A TREE', width / 2, height / 2);
    }

    image(seedImg, mouseX, mouseY, 32, 32);
}


function drawAboutPage() {
    colorMode(RGB);
    background(220, 235, 250);

    //decorative blob
    drawingContext.filter = 'blur(50px)';
    noStroke();
    fill(180, 210, 240);
    ellipse(width * 0.75, height * 0.25, 320, 320);
    drawingContext.filter = 'none';

    //title
    fill(230, 80, 120);
    textAlign(CENTER, CENTER);
    textFont('Barriecito');
    textSize(36);
    text('Fractal Trees', width / 2, 80);

    //body
    fill(90, 110, 130);
    textSize(18);
    textAlign(LEFT, TOP);
    let x = width / 2 - 200;
    let y = 150;
    let lh = 30;

    text('Click to plant a tree. Each tree is generated', x, y); y += lh;
    text('by a recursive branching algorithm.', x, y); y += lh * 1.6;

    text('The click position is used as a random seed —', x, y); y += lh;
    text('clicking the same spot produces the same tree.', x, y); y += lh * 1.6;

    text('Branches split at random angles, get thinner', x, y); y += lh;
    text('with each level, and have circles at the forks.', x, y); y += lh * 1.6;

    text('Mic input is mapped to wind strength.', x, y); y += lh;
    text('Wind affects grass and petals.', x, y); y += lh;
    text('Speech recognition converts voice to text', x, y); y += lh;
    text('that drops with physics.', x, y); y += lh * 2;

    //let's plant some trees together
    aboutReturnY = y;
    let hoverReturn = dist(mouseX, mouseY, width / 2, y) < 140;
    fill(230, 80, 120);
    textSize(hoverReturn ? 24 : 22);
    textAlign(CENTER, CENTER);
    text("let's plant some trees together !", width / 2, y);

    image(seedImg, mouseX, mouseY, 32, 32);
}


function drawTreePage() {
    colorMode(RGB);
    background(255, 235, 240);
    colorMode(HSB);

    updateWind();

    //petals
    if (isWindy() && random() < windStrength * 0.8) {
        createPetal();
    }

    updateAndDrawPetals();
    updateAndDrawWords();
    drawGrasses();

    //hint
    if (trees.length === 0) {
        colorMode(RGB);
        fill(230, 80, 120);
        noStroke();
        textAlign(CENTER, CENTER);
        textFont('Barriecito');
        textSize(24);
        text('click to plant', width / 2, height / 2);
        colorMode(HSB);
    }

    //trees
    for (let t of trees) {
        if (t.growth < 1) {
            t.growth = min(t.growth + 0.01, 1);
        }

        let totalLen = 0;
        let l = t.maxLen;
        while (l > t.minLen) {
            totalLen += l;
            l *= t.ratio;
        }
        totalLen += l;

        push();
        translate(t.x, t.y);
        stroke(t.hue, 50, 45);
        drawTree(t, t.maxLen, t.growth * totalLen, 0);
        pop();
    }

    image(seedImg, mouseX, mouseY, 32, 32);
}


function drawGrasses() {
    for (let g of grasses) {
        let dx = mouseX - g.x;
        let dy = mouseY - g.y;
        let dist = sqrt(dx * dx + dy * dy);
        let angle = atan2(dy, dx);

        //swirl
        let swirlRadius = 150;
        let swirlStrength = 0.8;
        let influence = max(0, 1 - dist / swirlRadius);

        //wind
        let windEffect = windStrength * 0.8;

        let targetRotation = g.baseRotation + (angle - HALF_PI) * influence * swirlStrength + windEffect;
        g.rotation = lerp(g.rotation, targetRotation, 0.15);

        noStroke();
        fill(g.hue, g.sat, g.bright);

        push();
        translate(g.x, g.y);
        rotate(g.rotation);
        triangle(-g.thickness, 0, g.thickness, 0, 0, -g.h);
        pop();
    }
}


function mousePressed() {
    //about button
    if (state !== 'about' && mouseX >= 15 && mouseX <= 110 && mouseY >= height - 55 && mouseY <= height - 10) {
        previousState = state;
        state = 'about';
        clearBtn.hide();
        aboutBtn.hide();
        return;
    }

    //clear button
    if (state === 'planting' && mouseX >= width - 90 && mouseX <= width - 5 && mouseY >= height - 55 && mouseY <= height - 10) {
        trees = [];
        clearWords();
        return;
    }

    if (state === 'start') {
        let d = dist(mouseX, mouseY, width / 2, height / 2);
        if (d < 180) {
            state = 'planting';
            generateGrasses();
            startMic();
            clearBtn.show();
        }
    } else if (state === 'planting') {
        if (mouseY < height - 50) {
            plantTreeAt(mouseX, mouseY);
        }
    } else if (state === 'about') {
        if (dist(mouseX, mouseY, width / 2, aboutReturnY) < 140) {
            state = previousState;
            aboutBtn.show();
            if (previousState === 'planting') clearBtn.show();
        }
    }
}


function generateGrasses() {
    grasses = [];
    let cols = 60;
    let rows = 40;
    let spacingX = width / cols;
    let spacingY = height / rows;

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            grasses.push({
                x: i * spacingX + random(-spacingX * 0.3, spacingX * 0.3),
                y: j * spacingY + random(-spacingY * 0.3, spacingY * 0.3),
                h: random(15, 35),
                baseRotation: random(-0.1, 0.1),
                rotation: 0,
                hue: random(180, 210),
                sat: random(40, 70),
                bright: random(60, 85),
                thickness: random(1.5, 3)
            });
        }
    }
}


function plantTreeAt(mx, my) {
    let seed = floor(mx) * 10000 + floor(my);
    randomSeed(seed * 2654435761);

    let r = random(0.5, 0.8);
    let minL = r > 0.65 ? random(8, 12) : random(5, 10);

    trees.push({
        x: mx,
        y: my,
        maxLen: random(50, 120),
        angleL: random(PI/10, PI/2.5),
        angleR: random(PI/10, PI/2.5),
        ratio: r,
        minLen: minL,
        endCircle: random() > 0.3,
        hue: random(360),
        thickness: random(0.8, 2.5),
        growth: 0
    });

    randomSeed(millis());
}


function drawTree(t, len, remaining, depth) {
    if (remaining <= 0) return;

    let segLen = min(len, remaining);
    strokeWeight(map(len, t.minLen, t.maxLen, 0.5, 3) * t.thickness);
    line(0, 0, 0, -segLen);
    translate(0, -segLen);

    remaining -= len;

    if (len > t.minLen && remaining > 0) {
        //circles
        let sizeMult = 0.8 + (((depth * 7 + t.x) % 100) / 100) * 0.7;
        let circleSize = map(len, t.minLen, t.maxLen, 20, 80) * sizeMult;
        let hueOffset = ((depth * 13 + t.y) % 60) - 30;
        let sat = 15 + ((depth * 11 + t.x) % 15);
        let bright = 75 + ((depth * 17 + t.y) % 15);

        noStroke();
        fill(t.hue + hueOffset, sat, bright, 0.4);
        ellipse(0, 0, circleSize, circleSize);
        stroke(t.hue, 50, 45);

        push();
        rotate(t.angleL);
        drawTree(t, len * t.ratio, remaining, depth * 2 + 1);
        pop();

        push();
        rotate(-t.angleR);
        drawTree(t, len * t.ratio, remaining, depth * 2 + 2);
        pop();
    } else if (len <= t.minLen && remaining >= 0 && t.endCircle) {
        noStroke();
        fill(t.hue, 70, 50);
        ellipse(0, 0, 4, 4);
    }
}


function createPetal() {
    petals.push({
        x: random(-50, width * 0.3),
        y: random(-50, height * 0.5),
        size: random(8, 16),
        rotation: random(TWO_PI),
        rotationSpeed: random(-0.1, 0.1),
        fallSpeed: random(1, 3),
        swayOffset: random(TWO_PI),
        swaySpeed: random(0.02, 0.05),
        hue: random(340, 360),
        sat: random(30, 50),
        bright: random(85, 95)
    });
}

function updateAndDrawPetals() {
    for (let i = petals.length - 1; i >= 0; i--) {
        let p = petals[i];

        p.x += windStrength * 8 + 0.5;
        p.y += p.fallSpeed;
        p.x += sin(frameCount * p.swaySpeed + p.swayOffset) * (1 + windStrength * 2);
        p.rotation += p.rotationSpeed + windStrength * 0.1;

        push();
        translate(p.x, p.y);
        rotate(p.rotation);
        noStroke();
        fill(p.hue, p.sat, p.bright, 0.8);
        ellipse(0, 0, p.size, p.size * 0.6);
        ellipse(p.size * 0.3, 0, p.size * 0.7, p.size * 0.4);
        pop();

        if (p.x > width + 50 || p.y > height + 50) {
            petals.splice(i, 1);
        }
    }
}
