const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const currentScoreEl = document.getElementById('current-score');
const highScoreEl = document.getElementById('high-score');
const finalScoreEl = document.getElementById('final-score');
const gameOverOverlay = document.getElementById('game-over-overlay');
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Game constants
const TILE_SIZE = 20;
const GRID_SIZE = canvas.width / TILE_SIZE;
const INITIAL_SPEED = 150;
const MIN_SPEED = 60;

// Game variables
let snake = [];
let food = {};
let dx = TILE_SIZE;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem('thSnakeHighScore') || 0;
let gameLoopTimeout;
let isGameRunning = false;
let changingDirection = false;
let currentSpeed = INITIAL_SPEED;

// Initialize
highScoreEl.textContent = highScore;

// Colors
const COLOR_HEAD = '#10b981';
const COLOR_BODY = '#34d399';
const COLOR_FOOD = '#f43f5e';
const COLOR_GRID = 'rgba(255, 255, 255, 0.03)';

function initGame() {
    // Initial snake at center
    snake = [
        {x: 10 * TILE_SIZE, y: 10 * TILE_SIZE},
        {x: 9 * TILE_SIZE, y: 10 * TILE_SIZE},
        {x: 8 * TILE_SIZE, y: 10 * TILE_SIZE}
    ];
    score = 0;
    dx = TILE_SIZE;
    dy = 0;
    currentSpeed = INITIAL_SPEED;
    currentScoreEl.textContent = score;
    spawnFood();
    draw();
}

function spawnFood() {
    let foodX, foodY;
    let isFoodOnSnake = true;
    
    while(isFoodOnSnake) {
        foodX = Math.floor(Math.random() * GRID_SIZE) * TILE_SIZE;
        foodY = Math.floor(Math.random() * GRID_SIZE) * TILE_SIZE;
        
        isFoodOnSnake = snake.some(segment => segment.x === foodX && segment.y === foodY);
    }
    
    food = {x: foodX, y: foodY};
}

function drawGrid() {
    ctx.strokeStyle = COLOR_GRID;
    ctx.lineWidth = 1;
    
    for (let i = 0; i < canvas.width; i += TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    
    for (let i = 0; i < canvas.height; i += TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Grid
    drawGrid();
    
    // Draw Food (with glow effect)
    ctx.shadowBlur = 15;
    ctx.shadowColor = COLOR_FOOD;
    ctx.fillStyle = COLOR_FOOD;
    ctx.beginPath();
    ctx.arc(food.x + TILE_SIZE/2, food.y + TILE_SIZE/2, TILE_SIZE/2 - 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Reset shadow for snake
    ctx.shadowBlur = 0;
    
    // Draw Snake
    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? COLOR_HEAD : COLOR_BODY;
        
        // Slightly smaller than tile size for gap effect
        if (index === 0) {
            // Head (rounded)
            ctx.shadowBlur = 10;
            ctx.shadowColor = COLOR_HEAD;
            ctx.beginPath();
            ctx.roundRect(segment.x + 1, segment.y + 1, TILE_SIZE - 2, TILE_SIZE - 2, 6);
            ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            // Body
            ctx.beginPath();
            ctx.roundRect(segment.x + 2, segment.y + 2, TILE_SIZE - 4, TILE_SIZE - 4, 4);
            ctx.fill();
        }
    });
}

function update() {
    if (!isGameRunning) return;
    
    changingDirection = false;
    
    // Calculate new head position
    const head = {
        x: snake[0].x + dx,
        y: snake[0].y + dy
    };
    
    // Check collisions
    if (checkCollision(head)) {
        gameOver();
        return;
    }
    
    snake.unshift(head);
    
    // Check food eaten
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        currentScoreEl.textContent = score;
        if (score > highScore) {
            highScore = score;
            highScoreEl.textContent = highScore;
            localStorage.setItem('thSnakeHighScore', highScore);
        }
        spawnFood();
        
        // Speed up slightly as score increases
        if (currentSpeed > MIN_SPEED) {
            currentSpeed -= 2;
        }
    } else {
        snake.pop(); // Remove tail if no food eaten
    }
    
    draw();
    
    // Use timeout for variable speed
    gameLoopTimeout = setTimeout(update, currentSpeed);
}

function checkCollision(head) {
    // Wall collision
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
        return true;
    }
    
    // Self collision
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

function gameOver() {
    isGameRunning = false;
    clearTimeout(gameLoopTimeout);
    finalScoreEl.textContent = score;
    gameOverOverlay.classList.remove('hidden');
}

function startGame() {
    startOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
    initGame();
    isGameRunning = true;
    update();
}

// Input Handling
function changeDirection(newDx, newDy) {
    if (changingDirection) return;
    
    const goingUp = dy === -TILE_SIZE;
    const goingDown = dy === TILE_SIZE;
    const goingRight = dx === TILE_SIZE;
    const goingLeft = dx === -TILE_SIZE;
    
    // Prevent reversing
    if (newDx === TILE_SIZE && goingLeft) return;
    if (newDx === -TILE_SIZE && goingRight) return;
    if (newDy === TILE_SIZE && goingUp) return;
    if (newDy === -TILE_SIZE && goingDown) return;
    
    dx = newDx;
    dy = newDy;
    changingDirection = true;
}

document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            changeDirection(0, -TILE_SIZE);
            e.preventDefault();
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            changeDirection(0, TILE_SIZE);
            e.preventDefault();
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            changeDirection(-TILE_SIZE, 0);
            e.preventDefault();
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            changeDirection(TILE_SIZE, 0);
            e.preventDefault();
            break;
    }
});

// Mobile Controls
document.getElementById('up-btn').addEventListener('click', () => changeDirection(0, -TILE_SIZE));
document.getElementById('down-btn').addEventListener('click', () => changeDirection(0, TILE_SIZE));
document.getElementById('left-btn').addEventListener('click', () => changeDirection(-TILE_SIZE, 0));
document.getElementById('right-btn').addEventListener('click', () => changeDirection(TILE_SIZE, 0));

// Swipe controls (basic implementation)
let touchStartX = 0;
let touchStartY = 0;
const canvasContainer = document.querySelector('.canvas-container');

canvasContainer.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, {passive: true});

canvasContainer.addEventListener('touchend', e => {
    let touchEndX = e.changedTouches[0].screenX;
    let touchEndY = e.changedTouches[0].screenY;
    
    handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
}, {passive: true});

function handleSwipe(startX, startY, endX, endY) {
    const diffX = endX - startX;
    const diffY = endY - startY;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (Math.abs(diffX) > 30) { // threshold
            if (diffX > 0) changeDirection(TILE_SIZE, 0); // Right
            else changeDirection(-TILE_SIZE, 0); // Left
        }
    } else {
        // Vertical swipe
        if (Math.abs(diffY) > 30) {
            if (diffY > 0) changeDirection(0, TILE_SIZE); // Down
            else changeDirection(0, -TILE_SIZE); // Up
        }
    }
}

// Button Events
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Initial draw
initGame();
