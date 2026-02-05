//mic setup
var mic;
var micLevel = 0;
var windStrength = 0;
var micReady = false;

//speech recognition
var recognition;

//matter.js
var { Engine, Bodies, Body, Composite } = Matter;
var engine;
var wordBodies = [];

function setupMic() {
    mic = new p5.AudioIn();
    setupSpeechRecognition();
    setupPhysics();
}

function setupPhysics() {
    engine = Engine.create();
    engine.world.gravity.y = 1;

    let ground = Bodies.rectangle(width / 2, height + 25, width, 50, { isStatic: true });
    let leftWall = Bodies.rectangle(-25, height / 2, 50, height, { isStatic: true });
    let rightWall = Bodies.rectangle(width + 25, height / 2, 50, height, { isStatic: true });
    Composite.add(engine.world, [ground, leftWall, rightWall]);
}

function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = function(event) {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript.trim();

        let chunks = transcript.split(' ');
        chunks.forEach(function(w, i) {
            if (w.length > 0) {
                setTimeout(function() { createFallingWord(w); }, i * 80);
            }
        });
    };

    recognition.onerror = function(event) {
        console.error('speech error:', event.error);
    };

    recognition.onend = function() {
        if (micReady) {
            recognition.start();
        }
    };
}

function startMic() {
    if (!micReady) {
        userStartAudio();
        mic.start();
        micReady = true;

        if (recognition) {
            try {
                recognition.start();
            } catch (e) {}
        }
    }
}

function updateWind() {
    if (!micReady) return 0;

    micLevel = mic.getLevel();
    var targetWind = map(micLevel, 0, 0.08, 0, 1);
    targetWind = constrain(targetWind, 0, 1);
    windStrength = lerp(windStrength, targetWind, 0.1);
    return windStrength;
}

function isWindy() {
    return windStrength > 0.05;
}

//create a word and drop it into matter
function createFallingWord(word) {
    let hues = [340, 350, 20, 180, 200, 280];
    let sz = random(20, 28);

    textFont('Barriecito');
    textSize(sz);
    let tw = textWidth(word);

    let x = random(60, width - 60);
    let body = Bodies.rectangle(x, -40, tw + 6, sz * 0.9, {
        restitution: 0.3,
        friction: 0.6,
        density: 0.002
    });

    body.wordData = {
        word: word,
        hue: hues[floor(random(hues.length))],
        sat: random(25, 45),
        bright: random(70, 85),
        size: sz
    };

    Composite.add(engine.world, body);
    wordBodies.push(body);
}

//update physics + draw words
function updateAndDrawWords() {
    Engine.update(engine, deltaTime);

    //wind pushes all word bodies
    if (windStrength > 0.05) {
        for (let body of wordBodies) {
            Body.applyForce(body, body.position, { x: windStrength * 0.003, y: 0 });
        }
    }

    for (let body of wordBodies) {
        let d = body.wordData;
        push();
        translate(body.position.x, body.position.y);
        rotate(body.angle);
        noStroke();
        fill(d.hue, d.sat, d.bright, 0.9);
        textAlign(CENTER, CENTER);
        textSize(d.size);
        textFont('Barriecito');
        text(d.word, 0, 0);
        pop();
    }
}

function clearWords() {
    for (let body of wordBodies) {
        Composite.remove(engine.world, body);
    }
    wordBodies = [];
}
