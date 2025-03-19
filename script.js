// DOM elements
const svg = d3.select("#simulation");
const numberOfBallsSlider = document.getElementById("numberOfBalls");
const ballSpeedSlider = document.getElementById("ballSpeed");
const numberOfPegsSlider = document.getElementById("numberOfPegs");
const numberOfBucketsSlider = document.getElementById("numberOfBuckets");
const resetBtn = document.getElementById("resetBtn");
const startBtn = document.getElementById("startBtn");

// Display values
const numberOfBallsValue = document.getElementById("numberOfBallsValue");
const ballSpeedValue = document.getElementById("ballSpeedValue");
const numberOfPegsValue = document.getElementById("numberOfPegsValue");
const numberOfBucketsValue = document.getElementById("numberOfBucketsValue");

// Configuration
let config = {
    width: 0,
    height: 0,
    ballRadius: 8,
    pegRadius: 5,
    ballSpeed: 10,
    numberOfBalls: 5000,
    numberOfPegRows: 15,
    numberOfBuckets: 25,
    pegs: [],
    buckets: [],
    balls: [],
    ballsInBuckets: [],
    running: false
};

// Physics setup (using d3-force for simple physics)
const simulation = d3.forceSimulation()
    .alphaTarget(0.3)
    .velocityDecay(0.1);

// Default configuration values
const defaultConfig = {
    ballRadius: 8,
    pegRadius: 5,
    ballSpeed: 10,
    numberOfBalls: 5000,
    numberOfPegRows: 15,
    numberOfBuckets: 25
};

// Initialize
function init() {
    // Get container dimensions
    const container = document.querySelector(".simulation-container");
    config.width = container.clientWidth;
    config.height = container.clientHeight;
    
    // Set SVG dimensions
    svg.attr("width", config.width)
       .attr("height", config.height);
    
    // Create buckets
    createBuckets();
    
    // Create pegs
    createPegs();
    
    // Setup event listeners
    setupEventListeners();
    
    // Log that initialization is complete
    console.log("Simulation initialized. Width:", config.width, "Height:", config.height);
}

// Create pegs in a triangular pattern
function createPegs() {
    config.pegs = [];
    svg.selectAll(".peg").remove();
    
    // Use a fixed peg area height
    const pegAreaHeight = config.height * 0.55; // Fixed at 55% of height
    const pegAreaTop = config.height * 0.1;
    
    // Ensure proper spacing based on number of rows
    const horizontalSpacing = config.width / (config.numberOfPegRows + 2);
    const verticalSpacing = pegAreaHeight / config.numberOfPegRows;
    
    for (let row = 0; row < config.numberOfPegRows; row++) {
        const pegsInRow = row + 1;
        const rowWidth = pegsInRow * horizontalSpacing;
        const startX = (config.width - rowWidth) / 2 + horizontalSpacing / 2;
        
        for (let col = 0; col < pegsInRow; col++) {
            const peg = {
                x: startX + col * horizontalSpacing,
                y: pegAreaTop + row * verticalSpacing,
                radius: config.pegRadius
            };
            config.pegs.push(peg);
        }
    }
    
    // Draw pegs
    svg.selectAll(".peg")
        .data(config.pegs)
        .enter()
        .append("circle")
        .attr("class", "peg")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => d.radius);
}

// Create buckets at the bottom
function createBuckets() {
    config.buckets = [];
    config.ballsInBuckets = new Array(config.numberOfBuckets).fill(0);
    
    svg.selectAll(".bucket").remove();
    svg.selectAll(".bucket-fill").remove();
    svg.selectAll(".bucket-count").remove();
    svg.selectAll(".landing-area").remove();
    
    const bucketWidth = config.width / config.numberOfBuckets;
    const bucketHeight = config.height * 0.2; // Slightly smaller proportion for larger heights
    
    // Calculate positions with fixed peg area height
    const pegAreaHeight = config.height * 0.55; // Fixed at 55% of height
    const pegAreaTop = config.height * 0.1;
    const pegAreaBottom = pegAreaTop + pegAreaHeight;
    
    // Position buckets at the bottom of the container, always
    const bucketY = config.height - bucketHeight - 20; // 20px padding from bottom
    
    // Create a separate landing area above buckets with clear separation
    const landingAreaHeight = Math.min(
        config.height * 0.1,
        (bucketY - pegAreaBottom - 30) * 0.8 // Ensure separation
    );
    
    // Place landing area with gap above buckets
    const landingAreaY = bucketY - landingAreaHeight - 15; // 15px gap between landing area and buckets
    
    for (let i = 0; i < config.numberOfBuckets; i++) {
        const bucket = {
            x: i * bucketWidth,
            y: bucketY,
            landingY: landingAreaY,
            width: bucketWidth,
            height: bucketHeight,
            count: 0
        };
        config.buckets.push(bucket);
    }
    
    // Draw bucket outlines
    svg.selectAll(".bucket")
        .data(config.buckets)
        .enter()
        .append("rect")
        .attr("class", "bucket")
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr("width", d => d.width)
        .attr("height", d => d.height);
    
    // Draw landing areas (where balls will actually land) - now clearly separated from buckets
    svg.selectAll(".landing-area")
        .data(config.buckets)
        .enter()
        .append("rect")
        .attr("class", "landing-area")
        .attr("x", d => d.x)
        .attr("y", d => d.landingY)
        .attr("width", d => d.width)
        .attr("height", landingAreaHeight);
    
    // Draw bucket fill areas (back inside the buckets, rising up from bottom)
    svg.selectAll(".bucket-fill")
        .data(config.buckets)
        .enter()
        .append("rect")
        .attr("class", "bucket-fill")
        .attr("x", d => d.x)
        .attr("y", d => d.y + d.height) // Position at bottom of bucket initially
        .attr("width", d => d.width)
        .attr("height", 0);
        
    // Add text for ball counts - positioned below the buckets at the bottom of SVG
    svg.selectAll(".bucket-count")
        .data(config.buckets)
        .enter()
        .append("text")
        .attr("class", "bucket-count")
        .attr("x", d => d.x + d.width / 2)
        .attr("y", d => d.y + d.height + 16) // Position below the bucket
        .attr("text-anchor", "middle")
        .attr("fill", "#333")
        .text("0");
}

// Create a new ball
function createBall() {
    if (config.balls.length >= config.numberOfBalls) {
        return;
    }
    
    // Add a more significant random x offset for wider distribution
    const randomOffset = (Math.random() - 0.5) * 40;
    
    // Random initial velocity for more chaotic motion
    const randomVx = (Math.random() - 0.5) * 1.5;
    
    const ball = {
        id: config.balls.length,
        x: config.width / 2 + randomOffset,
        y: -30, // Start further above the visible area
        vx: randomVx, // Add slight random horizontal velocity
        vy: 0.5 * config.ballSpeed + Math.random() * 0.5, // Randomize initial velocity
        radius: config.ballRadius,
        inBucket: false,
        bucketIndex: -1
    };
    
    config.balls.push(ball);
    
    // Optimize rendering when large numbers of balls
    // Use a smaller radius for better performance with large ball counts
    const renderRadius = 
        config.numberOfBalls > 5000 ? Math.max(2, config.ballRadius * 0.4) :
        config.numberOfBalls > 1000 ? Math.max(3, config.ballRadius * 0.6) : 
        config.ballRadius;
    
    // Draw ball
    svg.append("circle")
        .attr("class", "ball")
        .attr("id", `ball-${ball.id}`)
        .attr("cx", ball.x)
        .attr("cy", ball.y)
        .attr("r", renderRadius);
    
    return ball;
}

// Update bucket fill levels based on ball counts
function updateBucketDisplay() {
    // Find max count for scaling
    const maxCount = Math.max(...config.ballsInBuckets);
    
    // Update bucket fill levels - fills rise from bottom of buckets
    svg.selectAll(".bucket-fill")
        .data(config.buckets)
        .attr("y", (d, i) => {
            const fillHeight = (config.ballsInBuckets[i] / (maxCount || 1)) * d.height;
            // Position y at bottom of bucket minus the fill height
            return d.y + d.height - fillHeight;
        })
        .attr("height", (d, i) => {
            // Height is proportional to bucket count
            const fillHeight = (config.ballsInBuckets[i] / (maxCount || 1)) * d.height;
            return fillHeight;
        });
        
    // Update bucket count text
    svg.selectAll(".bucket-count")
        .data(config.buckets)
        .text((d, i) => config.ballsInBuckets[i]);
}

// Update ball positions and handle collisions
function updateBalls() {
    for (let i = 0; i < config.balls.length; i++) {
        const ball = config.balls[i];
        
        if (ball.inBucket) continue;
        
        // Apply gravity
        ball.vy += 0.2 * config.ballSpeed; // Increased gravity from 0.1 to 0.2
        
        // Update position
        ball.x += ball.vx;
        ball.y += ball.vy;
        
        // Constrain to screen
        if (ball.x - ball.radius < 0) {
            ball.x = ball.radius;
            ball.vx *= -0.1; // Reduced bounce off walls
        } else if (ball.x + ball.radius > config.width) {
            ball.x = config.width - ball.radius;
            ball.vx *= -0.1; // Reduced bounce off walls
        }
        
        // Debug logging - remove after fixing
        if (i === 0 && config.balls.length > 0 && ball.y < 100) {
            console.log(`Ball position: x=${ball.x}, y=${ball.y}, vy=${ball.vy}`);
        }
        
        // Optimization for large numbers of balls - only check nearby pegs
        // Check for peg collisions - for large ball counts, only check pegs that are close by
        const maxCheckDistance = config.ballRadius + config.pegRadius + 20;
        const ballY = ball.y;
        
        // Only check pegs that are near the ball's current vertical position
        // This optimizes performance with many balls
        for (let j = 0; j < config.pegs.length; j++) {
            const peg = config.pegs[j];
            
            // Skip pegs that are too far above or below
            if (Math.abs(peg.y - ballY) > maxCheckDistance) continue;
            
            const dx = ball.x - peg.x;
            // Skip pegs that are too far to the sides
            if (Math.abs(dx) > maxCheckDistance) continue;
            
            const dy = ballY - peg.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < ball.radius + peg.radius) {
                // Collision detected!
                // Normalize direction vector
                const nx = dx / distance;
                const ny = dy / distance;
                
                // Move ball out of collision
                const separation = ball.radius + peg.radius - distance;
                ball.x += nx * separation;
                ball.y += ny * separation;
                
                // Apply bounce force with bias - reduced bounce effect
                const dotProduct = ball.vx * nx + ball.vy * ny;
                ball.vx -= 1.2 * dotProduct * nx;
                ball.vy -= 1.2 * dotProduct * ny;
                
                // Apply random direction (50/50 chance of left or right) - no bias
                const goRight = Math.random() < 0.5;
                if (goRight) {
                    ball.vx += 0.3 * config.ballSpeed;
                } else {
                    ball.vx -= 0.3 * config.ballSpeed;
                }
                
                // Increased damping for less bounce
                ball.vx *= 0.6;
                ball.vy *= 0.9;
            }
        }
        
        // Check if ball entered a landing area (not the bucket itself)
        if (ball.y > config.buckets[0].landingY && !ball.inBucket) {
            // Find which bucket's landing area the ball is in
            const bucketIndex = Math.floor(ball.x / (config.width / config.numberOfBuckets));
            if (bucketIndex >= 0 && bucketIndex < config.numberOfBuckets) {
                ball.inBucket = true;
                ball.bucketIndex = bucketIndex;
                ball.vx = 0;
                ball.vy = 0;
                
                // Update bucket count
                config.ballsInBuckets[bucketIndex]++;
                updateBucketDisplay();
            }
        }
        
        // Update ball position in SVG
        const ball_element = d3.select(`#ball-${ball.id}`);
        ball_element.attr("cx", ball.x)
                    .attr("cy", ball.y);
    }
}

// Animation loop
function animate() {
    if (!config.running) return;
    
    // Create new ball if needed - increased ball creation rate for larger numbers
    if (config.balls.length < config.numberOfBalls && Math.random() < 0.1 * config.ballSpeed) {
        createBall();
        
        // For large numbers of balls, create multiple at once
        if (config.numberOfBalls > 500 && config.balls.length < config.numberOfBalls && Math.random() < 0.5) {
            createBall();
        }
        
        // For very large numbers, create even more at once
        if (config.numberOfBalls > 2000 && config.balls.length < config.numberOfBalls && Math.random() < 0.7) {
            createBall();
            createBall();
            
            // For extremely large numbers, create even more
            if (config.numberOfBalls > 5000 && Math.random() < 0.5) {
                createBall();
                createBall();
            }
        }
    }
    
    // Update ball positions
    updateBalls();
    
    // Continue animation
    requestAnimationFrame(animate);
}

// Start simulation
function startSimulation() {
    if (config.running) return;
    
    config.running = true;
    startBtn.textContent = "Pause Simulation";
    
    // Force create first ball immediately
    if (config.balls.length === 0) {
        createBall();
    }
    
    // Start animation loop
    animate();
}

// Pause simulation
function pauseSimulation() {
    config.running = false;
    startBtn.textContent = "Start Simulation";
}

// Reset simulation
function resetSimulation() {
    pauseSimulation();
    
    // Clear balls
    config.balls = [];
    svg.selectAll(".ball").remove();
    
    // Reset all configurations to default values
    config.ballSpeed = defaultConfig.ballSpeed;
    config.numberOfBalls = defaultConfig.numberOfBalls;
    config.numberOfPegRows = defaultConfig.numberOfPegRows;
    config.numberOfBuckets = defaultConfig.numberOfBuckets;
    
    // Update slider values and displays
    ballSpeedSlider.value = config.ballSpeed;
    ballSpeedValue.textContent = config.ballSpeed;
    
    numberOfBallsSlider.value = config.numberOfBalls;
    numberOfBallsValue.textContent = config.numberOfBalls;
    
    numberOfPegsSlider.value = config.numberOfPegRows;
    numberOfPegsValue.textContent = config.numberOfPegRows;
    
    numberOfBucketsSlider.value = config.numberOfBuckets;
    numberOfBucketsValue.textContent = config.numberOfBuckets;
    
    // Reset bucket counts
    config.ballsInBuckets = new Array(config.numberOfBuckets).fill(0);
    
    // Recreate pegs and buckets
    createPegs();
    createBuckets();
    
    // Reset bucket count display
    svg.selectAll(".bucket-count").text("0");
}

// Setup event listeners for controls
function setupEventListeners() {
    // Number of balls slider
    numberOfBallsSlider.addEventListener("input", function() {
        config.numberOfBalls = parseInt(this.value);
        numberOfBallsValue.textContent = config.numberOfBalls;
    });
    
    // Ball speed slider
    ballSpeedSlider.addEventListener("input", function() {
        config.ballSpeed = parseInt(this.value);
        ballSpeedValue.textContent = config.ballSpeed;
    });
    
    // Number of pegs slider
    numberOfPegsSlider.addEventListener("input", function() {
        config.numberOfPegRows = parseInt(this.value);
        numberOfPegsValue.textContent = config.numberOfPegRows;
        createPegs();
    });
    
    // Number of buckets slider
    numberOfBucketsSlider.addEventListener("input", function() {
        config.numberOfBuckets = parseInt(this.value);
        numberOfBucketsValue.textContent = config.numberOfBuckets;
        createBuckets();
    });
    
    // Reset button
    resetBtn.addEventListener("click", resetSimulation);
    
    // Start/Pause button
    startBtn.addEventListener("click", function() {
        if (config.running) {
            pauseSimulation();
        } else {
            startSimulation();
        }
    });
    
    // Window resize
    window.addEventListener("resize", function() {
        // Pause simulation
        const wasRunning = config.running;
        pauseSimulation();
        
        // Save ball state
        const ballsState = config.balls.map(ball => ({
            ...ball,
            relativeX: ball.x / config.width,
            relativeY: ball.y / config.height
        }));
        
        // Reinitialize
        init();
        
        // Restore balls with adjusted positions
        config.balls = ballsState.map((state, id) => ({
            ...state,
            id,
            x: state.relativeX * config.width,
            y: state.relativeY * config.height
        }));
        
        // Redraw balls
        svg.selectAll(".ball").remove();
        config.balls.forEach(ball => {
            svg.append("circle")
                .attr("class", "ball")
                .attr("id", `ball-${ball.id}`)
                .attr("cx", ball.x)
                .attr("cy", ball.y)
                .attr("r", ball.radius);
        });
        
        // Restart if it was running
        if (wasRunning) {
            startSimulation();
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", init);