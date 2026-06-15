# Bareiss-Montante Calculator

A visual step-by-step calculator for solving systems of linear equations using the Bareiss-Montante method.

## About

This project helps users understand the Bareiss-Montante method by showing each step of the matrix transformation process. It highlights the pivot row, pivot column, calculated values, and special cases such as infinitely many solutions or inconsistent systems.

The project also includes a theory page with explanations, formulas, examples, and images.

## Features

- Create an augmented matrix based on the number of variables.
- Solve systems step by step using the Bareiss-Montante method.
- Highlight pivots, rows, columns, and calculated cells.
- Normalize the final diagonal matrix into identity form.
- Detect infinitely many solutions.
- Detect systems with no solution.
- Include a theory page explaining the method.

## How to use

1. Enter the number of variables.
2. Click **Create augmented matrix**.
3. Fill in the coefficients and constants.
4. Click **Start Montante**.
5. Use **Next operation** to follow the method step by step.

## Technologies

- HTML
- CSS
- JavaScript

No frameworks or external libraries are required.

## Project files

- `index.html` — Calculator page
- `theory.html` — Theory page
- `style.css` — Page design
- `scripts.js` — Calculator logic
- `img/` — Images used in the theory page

## Status

The main calculator and theory page are working. The current version includes visual steps, final normalization, and special case detection.