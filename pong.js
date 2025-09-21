// Game state and configuration
const gameState = {
    canvas: null,
    ctx: null,
    animationId: null,
    isGameRunning: false,
    playerScore: 0,
    computerScore: 0,
    mouse: { y: 0 },
    keys: { up: false, down: false }
};

const gameConfig = {
    paddleWidth: 10,
    paddleHeight: 80,
    ballRadius: 8,
    paddleSpeed: 6,
    ballBaseSpeed: 4,
    maxBallSpeed: 12,
    aiSpeed: 4.5
};

// Game objects
const player = {
    x: 30,
    y: 0,
    width: gameConfig.paddleWidth,
    height: gameConfig.paddleHeight,
    speed: gameConfig.paddleSpeed
};

const computer = {
    x: 0, // Will be set based on canvas width
    y: 0,
    width: gameConfig.paddleWidth,
    height: gameConfig.paddleHeight,
    speed: gameConfig.aiSpeed
};

const ball = {
    x: 0,
    y: 0,
    radius: gameConfig.ballRadius,
    speedX: 0,
    speedY: 0,
    baseSpeed: gameConfig.ballBaseSpeed
};

// Initialize the game
function initGame() {
    gameState.canvas = document.getElementById('gameCanvas');
    gameState.ctx = gameState.canvas.getContext('2d');
    
    // Set initial positions
    resetPositions();
    
    // Add event listeners
    setupEventListeners();
    
    // Start the game loop
    gameState.isGameRunning = true;
    gameLoop();
}

// Reset game positions
function resetPositions() {
    const canvas = gameState.canvas;
    
    // Reset paddle positions
    player.y = (canvas.height - player.height) / 2;
    computer.x = canvas.width - computer.width - 30;
    computer.y = (canvas.height - computer.height) / 2;
    
    // Reset ball position and speed
    resetBall();
}

// Reset ball to center with random direction
function resetBall() {
    const canvas = gameState.canvas;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    
    // Random direction (left or right)
    const direction = Math.random() < 0.5 ? -1 : 1;
    ball.speedX = direction * ball.baseSpeed;
    ball.speedY = (Math.random() - 0.5) * ball.baseSpeed;
}

// Setup event listeners
function setupEventListeners() {
    const canvas = gameState.canvas;
    
    // Mouse controls
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        gameState.mouse.y = e.clientY - rect.top;
    });
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                gameState.keys.up = true;
                e.preventDefault();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                gameState.keys.down = true;
                e.preventDefault();
                break;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                gameState.keys.up = false;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                gameState.keys.down = false;
                break;
        }
    });
    
    // Reset button
    document.getElementById('resetBtn').addEventListener('click', resetGame);
}

// Main game loop
function gameLoop() {
    if (!gameState.isGameRunning) return;
    
    update();
    render();
    
    gameState.animationId = requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
    updatePlayerPaddle();
    updateComputerPaddle();
    updateBall();
    checkCollisions();
    checkScoring();
}

// Update player paddle
function updatePlayerPaddle() {
    const canvas = gameState.canvas;
    
    // Mouse control (primary)
    if (gameState.mouse.y > 0) {
        player.y = gameState.mouse.y - player.height / 2;
    }
    
    // Keyboard control (secondary)
    if (gameState.keys.up) {
        player.y -= player.speed;
    }
    if (gameState.keys.down) {
        player.y += player.speed;
    }
    
    // Keep paddle within bounds
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

// Update computer paddle (AI)
function updateComputerPaddle() {
    const canvas = gameState.canvas;
    const paddleCenter = computer.y + computer.height / 2;
    const ballY = ball.y;
    
    // AI follows the ball with some delay for realism
    if (paddleCenter < ballY - 35) {
        computer.y += computer.speed;
    } else if (paddleCenter > ballY + 35) {
        computer.y -= computer.speed;
    }
    
    // Keep computer paddle within bounds
    computer.y = Math.max(0, Math.min(canvas.height - computer.height, computer.y));
}

// Update ball position
function updateBall() {
    ball.x += ball.speedX;
    ball.y += ball.speedY;
}

// Check collisions
function checkCollisions() {
    const canvas = gameState.canvas;
    
    // Ball collision with top and bottom walls
    if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= canvas.height) {
        ball.speedY = -ball.speedY;
        ball.y = Math.max(ball.radius, Math.min(canvas.height - ball.radius, ball.y));
    }
    
    // Ball collision with player paddle
    if (ball.x - ball.radius <= player.x + player.width &&
        ball.x + ball.radius >= player.x &&
        ball.y >= player.y &&
        ball.y <= player.y + player.height &&
        ball.speedX < 0) {
        
        // Calculate hit position (0 to 1, where 0.5 is center)
        const hitPos = (ball.y - player.y) / player.height;
        const angle = (hitPos - 0.5) * Math.PI / 3; // Max 60 degrees
        
        // Increase speed slightly
        const currentSpeed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);
        const newSpeed = Math.min(currentSpeed * 1.05, gameConfig.maxBallSpeed);
        
        ball.speedX = Math.cos(angle) * newSpeed;
        ball.speedY = Math.sin(angle) * newSpeed;
        
        // Make sure ball moves right
        ball.speedX = Math.abs(ball.speedX);
        
        // Move ball away from paddle to prevent sticking
        ball.x = player.x + player.width + ball.radius;
    }
    
    // Ball collision with computer paddle
    if (ball.x + ball.radius >= computer.x &&
        ball.x - ball.radius <= computer.x + computer.width &&
        ball.y >= computer.y &&
        ball.y <= computer.y + computer.height &&
        ball.speedX > 0) {
        
        // Calculate hit position
        const hitPos = (ball.y - computer.y) / computer.height;
        const angle = (hitPos - 0.5) * Math.PI / 3;
        
        // Increase speed slightly
        const currentSpeed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);
        const newSpeed = Math.min(currentSpeed * 1.05, gameConfig.maxBallSpeed);
        
        ball.speedX = -Math.cos(angle) * newSpeed;
        ball.speedY = Math.sin(angle) * newSpeed;
        
        // Make sure ball moves left
        ball.speedX = -Math.abs(ball.speedX);
        
        // Move ball away from paddle to prevent sticking
        ball.x = computer.x - ball.radius;
    }
}

// Check for scoring
function checkScoring() {
    const canvas = gameState.canvas;
    
    if (ball.x < 0) {
        // Computer scores
        gameState.computerScore++;
        updateScoreboard();
        resetBall();
    } else if (ball.x > canvas.width) {
        // Player scores
        gameState.playerScore++;
        updateScoreboard();
        resetBall();
    }
}

// Update scoreboard display
function updateScoreboard() {
    document.getElementById('playerScore').textContent = gameState.playerScore;
    document.getElementById('computerScore').textContent = gameState.computerScore;
}

// Render the game
function render() {
    const ctx = gameState.ctx;
    const canvas = gameState.canvas;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw center line
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw paddles
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillRect(computer.x, computer.y, computer.width, computer.height);
    
    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    
    // Add glow effect to ball
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

// Reset the game
function resetGame() {
    gameState.playerScore = 0;
    gameState.computerScore = 0;
    updateScoreboard();
    resetPositions();
}

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);