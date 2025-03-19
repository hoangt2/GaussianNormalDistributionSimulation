# Gaussian Distribution Simulation

This interactive web application demonstrates how the Gaussian (normal) distribution emerges naturally from a physical process. It uses D3.js to create a simulation similar to a Galton Board (also known as a bean machine or quincunx).

## How It Works

Balls drop from the top of the screen and bounce off pegs arranged in a triangular pattern. As each ball hits a peg, it has a probability to go either left or right. After passing through multiple rows of pegs, the balls collect in buckets at the bottom.

The distribution of balls in the buckets naturally forms a bell curve approximating the normal distribution, demonstrating the Central Limit Theorem in action.

## Features

- Adjust the number of balls in the simulation
- Control the speed of the falling balls
- Change the number of peg rows and buckets
- Modify the probability bias for balls going left or right at each peg
- Interactive controls with real-time updates
- Responsive design

## How to Use

1. Open `index.html` in a modern web browser
2. Use the sliders to adjust simulation parameters
3. Click "Start Simulation" to begin
4. Click "Reset Simulation" to clear all balls and start over

## Controls Explained

- **Number of Balls**: Total number of balls to drop in the simulation
- **Ball Speed**: Controls how quickly the balls fall
- **Number of Peg Rows**: Determines how many rows of pegs the balls will encounter
- **Number of Buckets**: Sets how many collection buckets are at the bottom
- **Peg Bias**: Probability of a ball going right when it hits a peg (50% is unbiased)

## Technical Details

This simulation is built using:
- HTML5
- CSS3
- JavaScript
- D3.js for visualization and animation

## Mathematical Connection

This simulation demonstrates several important statistical concepts:
- The binomial distribution (at each peg, the ball makes a binary choice)
- The Central Limit Theorem (the sum of many random events tends toward a normal distribution)
- How randomness can produce predictable patterns

For a bias of 50% (equal probability of left/right), the resulting distribution approximates a normal distribution. For other values, it demonstrates how skewed distributions can form. 