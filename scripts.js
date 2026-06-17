const matrixButton = document.getElementById("matrixButton");
const startButton = document.getElementById("startButton");
const previousStepButton = document.getElementById("previousStepButton");
const nextStepButton = document.getElementById("nextStepButton");
const operationSelect = document.getElementById("operation");

const matrixContainer = document.getElementById("matrixContainer");
const currentMatrixContainer = document.getElementById("currentMatrixContainer");
const newMatrixContainer = document.getElementById("newMatrixContainer");
const stepInfo = document.getElementById("stepInfo");
const stepCounter = document.getElementById("stepCounter");
const formulaBox = document.getElementById("formulaBox");

let events = [];
let currentEventIndex = 0;

matrixButton.addEventListener("click", createMatrix);
startButton.addEventListener("click", startMontante);
previousStepButton.addEventListener("click", previousStep);
nextStepButton.addEventListener("click", nextStep);
operationSelect.addEventListener("change", updateOperationHint);

function createMatrix() {
    const operation = document.getElementById("operation").value;
    const size = Number(document.getElementById("variables").value);

    const rows = size;
    let columns;

    if (operation === "inverse") {
        columns = size * 2;
    } else if (operation === "determinant") {
        columns = size;
    } else {
        columns = size + 1;
    }

    matrixContainer.innerHTML = "";
    clearStepPanel();
    updateOperationHint();

    const table = document.createElement("table");

    for (let i = 0; i < rows; i++) {
        const tr = document.createElement("tr");

        for (let j = 0; j < columns; j++) {
            const td = document.createElement("td");
            const input = document.createElement("input");

            input.type = "number";
            input.value = "0";
            input.className = "matrix-input";
            input.dataset.row = i;
            input.dataset.column = j;

            if (operation !== "determinant" && j === size) {
                td.classList.add("augmented-separator");
            }

            if (operation === "inverse" && j >= size) {
                input.value = i === j - size ? "1" : "0";
                input.disabled = true;
                input.classList.add("identity-input");
            }

            td.appendChild(input);
            tr.appendChild(td);
        }

        table.appendChild(tr);
    }

    matrixContainer.appendChild(table);
    startButton.disabled = false;
}

function startMontante() {
    const operation = document.getElementById("operation").value;
    const size = Number(document.getElementById("variables").value);

    const rows = size;
    let columns;

    if (operation === "inverse") {
        columns = size * 2;
    } else if (operation === "determinant") {
        columns = size;
    } else {
        columns = size + 1;
    }
    const matrix = getMatrixFromInputs(rows, columns);

    events = buildMontanteEvents(matrix, operation, size);
    currentEventIndex = 0;

    renderCurrentEvent();
}

function buildMontanteEvents(initialMatrix, operationMode = "system", size = initialMatrix.length) {    const rows = initialMatrix.length;
    const columns = initialMatrix[0].length;

    let currentMatrix = cloneMatrix(initialMatrix);
    let previousPivot = 1;
    let generatedEvents = [];
    let rowSwapCount = 0;

    generatedEvents.push({
        title: "Initial matrix",
        description: "This is the matrix before applying the Bareiss-Montante method.",
        currentMatrix: cloneMatrix(currentMatrix),
        newMatrix: createBlankMatrix(rows, columns),
        currentHighlights: {},
        newHighlights: {},
        formula: "Press Next operation to start selecting the first pivot."
    });

    for (let k = 0; k < rows; k++) {
        if (isZero(currentMatrix[k][k])) {
            const swapRow = findRowToSwap(currentMatrix, k);

            if (swapRow === -1) {
                if (operationMode === "determinant") {
                    generatedEvents.push({
                        title: "Determinant is zero",
                        description: `The pivot in position (${k + 1}, ${k + 1}) is zero and there is no row available to swap.`,
                        currentMatrix: cloneMatrix(currentMatrix),
                        newMatrix: cloneMatrix(currentMatrix),
                        currentHighlights: {
                            pivot: [k, k],
                            zeroRows: [k]
                        },
                        newHighlights: {
                            zeroRows: [k]
                        },
                        formula: "A zero pivot with no possible row swap means the matrix is singular.\n\nTherefore:\n\ndet(A) = 0"
                    });

                    return generatedEvents;
                }
                
                if (operationMode === "inverse") {
                    generatedEvents.push({
                        title: "Matrix has no inverse",
                        description: `The pivot in position (${k + 1}, ${k + 1}) is zero and there is no row available to swap.`,
                        currentMatrix: cloneMatrix(currentMatrix),
                        newMatrix: cloneMatrix(currentMatrix),
                        currentHighlights: {
                            pivot: [k, k],
                            zeroRows: [k]
                        },
                        newHighlights: {
                            zeroRows: [k]
                        },
                        formula: getSingularMatrixText()
                    });

                    return generatedEvents;
                }
                const specialRowInfo = detectSpecialRow(currentMatrix, columns - 1);

                if (specialRowInfo.type === "infinite") {
                    generatedEvents.push({
                        title: "Infinitely many solutions",
                        description: `Row ${specialRowInfo.row + 1} became a complete zero row. This means at least one equation depends on the others.`,
                        currentMatrix: cloneMatrix(currentMatrix),
                        newMatrix: cloneMatrix(currentMatrix),
                        currentHighlights: {
                            zeroRows: [specialRowInfo.row]
                        },
                        newHighlights: {
                            zeroRows: [specialRowInfo.row]
                        },
                        formula: getInfiniteSolutionText(initialMatrix)
                    });

                    return generatedEvents;
                }

                if (specialRowInfo.type === "none") {
                    generatedEvents.push({
                        title: "No solution",
                        description: `Row ${specialRowInfo.row + 1} has all zero coefficients, but the augmented value is not zero.`,
                        currentMatrix: cloneMatrix(currentMatrix),
                        newMatrix: cloneMatrix(currentMatrix),
                        currentHighlights: {
                            contradictionRows: [specialRowInfo.row],
                            contradictionValue: [specialRowInfo.row, columns - 1]
                        },
                        newHighlights: {
                            contradictionRows: [specialRowInfo.row],
                            contradictionValue: [specialRowInfo.row, columns - 1]
                        },
                        formula: getNoSolutionText(columns - 1, specialRowInfo.constant)
                    });

                    return generatedEvents;
                }

                generatedEvents.push({
                    title: "Zero pivot",
                    description: `The pivot in position (${k + 1}, ${k + 1}) is zero and there is no row available to swap.`,
                    currentMatrix: cloneMatrix(currentMatrix),
                    newMatrix: createBlankMatrix(rows, columns),
                    currentHighlights: { pivot: [k, k] },
                    newHighlights: {},
                    formula: "The method cannot continue with this pivot."
                });

                return generatedEvents;
            }
            const temp = currentMatrix[k];
            currentMatrix[k] = currentMatrix[swapRow];
            currentMatrix[swapRow] = temp;
            rowSwapCount++;

            generatedEvents.push({
                title: "Row swap",
                description: `The pivot was zero, so row ${k + 1} was swapped with row ${swapRow + 1}.`,
                currentMatrix: cloneMatrix(currentMatrix),
                newMatrix: createBlankMatrix(rows, columns),
                currentHighlights: { row: k },
                newHighlights: {},
                formula: `R${k + 1} ↔ R${swapRow + 1}`
            });
        }

        const pivot = currentMatrix[k][k];
        let newMatrix = createBlankMatrix(rows, columns);

        generatedEvents.push({
            title: `Stage ${k + 1}: choose pivot`,
            description: `The pivot is the element in position (${k + 1}, ${k + 1}). The pivot value is ${formatNumber(pivot)}.`,
            currentMatrix: cloneMatrix(currentMatrix),
            newMatrix: cloneMatrix(newMatrix),
            currentHighlights: {
            pivot: [k, k],
            row: k
        },
        newHighlights: {},
            formula: `Pivot = a${k + 1}${k + 1} = ${formatNumber(pivot)}
Previous pivot = ${formatNumber(previousPivot)}`
        });

        for (let j = 0; j < columns; j++) {
            newMatrix[k][j] = currentMatrix[k][j];
        }

        generatedEvents.push({
            title: "Keep pivot row",
            description: `The pivot row, row ${k + 1}, stays the same in this stage.`,
            currentMatrix: cloneMatrix(currentMatrix),
            newMatrix: cloneMatrix(newMatrix),
            currentHighlights: {
                pivot: [k, k],
                row: k
            },
            newHighlights: {
                row: k
            },
            formula: `Row ${k + 1} is copied into the new matrix.`
        });

        for (let i = 0; i < rows; i++) {
            if (i !== k) {
                newMatrix[i][k] = 0;
            }
        }

        generatedEvents.push({
            title: "Make pivot column zero",
            description: `All elements in column ${k + 1}, except the pivot, become 0.`,
            currentMatrix: cloneMatrix(currentMatrix),
            newMatrix: cloneMatrix(newMatrix),
            currentHighlights: {
            pivot: [k, k],
            row: k,
            column: k
        },
        newHighlights: {
            row: k,
            column: k
        },
            formula: `In the new matrix, every value in column ${k + 1} becomes 0, except the pivot in row ${k + 1}.

            Column ${k + 1}: a'${k + 1}${k + 1} stays as the pivot, and the rest become 0.`        });

        for (let i = 0; i < rows; i++) {
            if (i === k) continue;

            for (let j = 0; j < columns; j++) {
                if (j === k) continue;

                const currentValue = currentMatrix[i][j];
                const columnValue = currentMatrix[i][k];
                const rowValue = currentMatrix[k][j];

                const numerator = pivot * currentValue - columnValue * rowValue;
                const result = cleanNumber(numerator / previousPivot);

                newMatrix[i][j] = result;

                generatedEvents.push({
                    title: `Calculate cell (${i + 1}, ${j + 1})`,
                    description: `Now we calculate the new value for row ${i + 1}, column ${j + 1}.`,
                    currentMatrix: cloneMatrix(currentMatrix),
                    newMatrix: cloneMatrix(newMatrix),
                    currentHighlights: {
                        pivot: [k, k],
                        activeCells: [
                            [i, j],
                            [i, k],
                            [k, j]
                        ]
                    },
                    newHighlights: {
                        activeCells: [
                            [i, j]
                        ]
                    },
                    formula:
`a'${i + 1}${j + 1} = (pivot · a${i + 1}${j + 1} - a${i + 1}${k + 1} · a${k + 1}${j + 1}) / previous pivot

a'${i + 1}${j + 1} = (${formatNumber(pivot)} · ${formatNumber(currentValue)} - ${formatNumber(columnValue)} · ${formatNumber(rowValue)}) / ${formatNumber(previousPivot)}

a'${i + 1}${j + 1} = ${formatNumber(result)}`
                });
            }
        }



        currentMatrix = cloneMatrix(newMatrix);
        previousPivot = pivot;
    }

    if (operationMode === "determinant") {
        const determinant = getMontanteDeterminant(currentMatrix, rowSwapCount);

        generatedEvents.push({
            title: "Determinant result",
            description: "The Bareiss-Montante process is complete. The determinant can be read from the final diagonal matrix.",
            currentMatrix: cloneMatrix(currentMatrix),
            newMatrix: cloneMatrix(currentMatrix),
            currentHighlights: {},
            newHighlights: {},
            formula: getDeterminantText(currentMatrix, determinant, rowSwapCount)
        });

        return generatedEvents;
    }
    const normalizedMatrix = normalizeFinalMatrix(currentMatrix);

    if (operationMode === "inverse") {
        generatedEvents.push({
            title: "Normalize inverse matrix",
            description: "The method is complete. Now each row is divided by its diagonal value so the left side becomes the identity matrix.",
            currentMatrix: cloneMatrix(currentMatrix),
            newMatrix: cloneMatrix(normalizedMatrix),
            currentHighlights: {},
            newHighlights: {},
            formula: `${getNormalizationText(currentMatrix)}

    ${getInverseText(normalizedMatrix, size)}`
        });

        return generatedEvents;
    }

    generatedEvents.push({
        title: "Normalize final matrix",
        description: "The method is complete. Now each row is divided by its diagonal value so the coefficient matrix becomes the identity matrix.",
        currentMatrix: cloneMatrix(currentMatrix),
        newMatrix: cloneMatrix(normalizedMatrix),
        currentHighlights: {},
        newHighlights: {},
        formula: `${getNormalizationText(currentMatrix)}

    ${getNormalizedSolutionText(normalizedMatrix)}`
    });

    return generatedEvents;
}

function renderCurrentEvent() {
    const event = events[currentEventIndex];

    stepInfo.innerHTML = `
        <strong>${event.title}</strong><br>
        ${event.description}
    `;

    stepCounter.textContent = `Step ${currentEventIndex + 1} of ${events.length}`;

    formulaBox.textContent = event.formula;

    renderMatrix(currentMatrixContainer, event.currentMatrix, event.currentHighlights);
    renderMatrix(newMatrixContainer, event.newMatrix, event.newHighlights);

    previousStepButton.disabled = currentEventIndex === 0;
    nextStepButton.disabled = currentEventIndex === events.length - 1;
}

function renderMatrix(container, matrix, highlights) {
    container.innerHTML = "";

    const table = document.createElement("table");

    for (let i = 0; i < matrix.length; i++) {
        const tr = document.createElement("tr");

        for (let j = 0; j < matrix[i].length; j++) {
            const td = document.createElement("td");
            const value = matrix[i][j];

            if (value === null) {
                td.textContent = "·";
                td.classList.add("blank-cell");
            } else {
                td.textContent = formatNumber(value);
                td.classList.add("new-filled-cell");
            }

            if (highlights.row === i) {
                td.classList.add("pivot-row");
            }

            if (highlights.column === j) {
                td.classList.add("pivot-column");
            }
            if (highlights.zeroRows && highlights.zeroRows.includes(i)) {
                td.classList.add("zero-row");
            }

            if (highlights.contradictionRows && highlights.contradictionRows.includes(i)) {
                td.classList.add("contradiction-row");
            }

            if (
                highlights.contradictionValue &&
                highlights.contradictionValue[0] === i &&
                highlights.contradictionValue[1] === j
            ) {
                td.classList.add("contradiction-value");
            }

            if (highlights.pivot && highlights.pivot[0] === i && highlights.pivot[1] === j) {
                td.classList.add("pivot-cell");
            }

            if (isActiveCell(highlights.activeCells, i, j)) {
                td.classList.add("active-cell");
            }
            if (j === matrix.length) {
                td.classList.add("augmented-separator");
            }

            tr.appendChild(td);
        }

        table.appendChild(tr);
    }

    container.appendChild(table);
}

function previousStep() {
    if (currentEventIndex > 0) {
        currentEventIndex--;
        renderCurrentEvent();
    }
}

function nextStep() {
    if (currentEventIndex < events.length - 1) {
        currentEventIndex++;
        renderCurrentEvent();
    }
}

function getMatrixFromInputs(rows, columns) {
    let matrix = [];

    for (let i = 0; i < rows; i++) {
        matrix[i] = [];

        for (let j = 0; j < columns; j++) {
            const input = document.querySelector(`[data-row="${i}"][data-column="${j}"]`);
            matrix[i][j] = Number(input.value);
        }
    }

    return matrix;
}

function findRowToSwap(matrix, pivotIndex) {
    for (let i = pivotIndex + 1; i < matrix.length; i++) {
        if (!isZero(matrix[i][pivotIndex])) {
            return i;
        }
    }

    return -1;
}

function createBlankMatrix(rows, columns) {
    return Array.from({ length: rows }, () => Array(columns).fill(null));
}

function cloneMatrix(matrix) {
    return matrix.map(row => [...row]);
}

function isZero(value) {
    return Math.abs(value) < 0.0000001;
}

function cleanNumber(value) {
    if (Math.abs(value) < 0.0000001) {
        return 0;
    }

    return value;
}

function formatNumber(value) {
    if (value === null) {
        return "";
    }

    if (Number.isInteger(value)) {
        return value.toString();
    }

    return Number(value.toFixed(4)).toString();
}

function isActiveCell(activeCells, row, column) {
    if (!activeCells) return false;

    return activeCells.some(cell => cell[0] === row && cell[1] === column);
}

function getSolutionText(matrix) {
    const rows = matrix.length;
    const lastColumn = matrix[0].length - 1;

    let text = "";

    for (let i = 0; i < rows; i++) {
        const diagonal = matrix[i][i];
        const constant = matrix[i][lastColumn];

        if (isZero(diagonal)) {
            text += `x${i + 1} cannot be calculated because the diagonal value is 0.\n`;
        } else {
            const solution = constant / diagonal;
            text += `x${i + 1} = ${formatNumber(constant)} / ${formatNumber(diagonal)} = ${formatNumber(solution)}\n`;
        }
    }

    return text;
}

function clearStepPanel() {
    events = [];
    currentEventIndex = 0;

    currentMatrixContainer.innerHTML = "";
    newMatrixContainer.innerHTML = "";
    formulaBox.textContent = "";
    stepCounter.textContent = "";
    stepInfo.textContent = "Create a matrix and press Start Montante.";

    previousStepButton.disabled = true;
    nextStepButton.disabled = true;
}

function iLabel() {
    return "i";
}

function detectSpecialRow(matrix, variables) {
    for (let i = 0; i < matrix.length; i++) {
        let allCoefficientsZero = true;

        for (let j = 0; j < variables; j++) {
            if (!isZero(matrix[i][j])) {
                allCoefficientsZero = false;
                break;
            }
        }

        const augmentedValue = matrix[i][variables];

        if (allCoefficientsZero && isZero(augmentedValue)) {
            return {
                type: "infinite",
                row: i,
                constant: augmentedValue
            };
        }

        if (allCoefficientsZero && !isZero(augmentedValue)) {
            return {
                type: "none",
                row: i,
                constant: augmentedValue
            };
        }
    }

    return {
        type: "unknown",
        row: -1,
        constant: 0
    };
}
function getInfiniteSolutionText(matrix) {
    const variables = matrix[0].length - 1;
    const rrefData = getRREF(matrix);
    const rref = rrefData.matrix;
    const pivotColumns = rrefData.pivotColumns;

    const freeColumns = [];

    for (let j = 0; j < variables; j++) {
        if (!pivotColumns.includes(j)) {
            freeColumns.push(j);
        }
    }

    const parameterNames = ["t", "s", "r", "u", "v"];
    const expressions = Array(variables).fill("");

    for (let i = 0; i < freeColumns.length; i++) {
        const freeColumn = freeColumns[i];
        const parameter = parameterNames[i] || `t${i + 1}`;
        expressions[freeColumn] = parameter;
    }

    for (let row = 0; row < pivotColumns.length; row++) {
        const pivotColumn = pivotColumns[row];
        let expression = formatNumber(rref[row][variables]);

        for (let i = 0; i < freeColumns.length; i++) {
            const freeColumn = freeColumns[i];
            const parameter = parameterNames[i] || `t${i + 1}`;
            const coefficient = -rref[row][freeColumn];

            if (!isZero(coefficient)) {
                expression += formatSignedTerm(coefficient, parameter);
            }
        }

        expressions[pivotColumn] = expression;
    }

    let text = "";

    text += "A complete zero row appeared:\n";
    text += "0x1 + 0x2 + ... + 0xn = 0\n\n";
    text += "This means at least one equation depends on the others.\n";
    text += "Since there is at least one free variable, the system has infinitely many solutions.\n\n";

    for (let i = 0; i < freeColumns.length; i++) {
        const parameter = parameterNames[i] || `t${i + 1}`;
        text += `Let x${freeColumns[i] + 1} = ${parameter}\n`;
    }

    text += "\nParametric solution:\n\n";

    for (let i = 0; i < variables; i++) {
        text += `x${i + 1} = ${expressions[i]}\n`;
    }

    text += "\nVector form:\n\n";
    text += getVectorForm(rref, pivotColumns, freeColumns, variables, parameterNames);

    return text;
}
function getNoSolutionText(variables, constant) {
    const leftSide = Array.from(
        { length: variables },
        (_, index) => `0x${index + 1}`
    ).join(" + ");

    return `A contradiction row appeared:

${leftSide} = ${formatNumber(constant)}

The left side is always 0, no matter what values the variables take.

So it is impossible for 0 to be equal to ${formatNumber(constant)}.

Therefore, the system is inconsistent and has no solution.`;
}

function getRREF(matrix) {
    let m = matrix.map(row => row.slice());
    const rows = m.length;
    const columns = m[0].length;
    const variables = columns - 1;

    let pivotRow = 0;
    let pivotColumns = [];

    for (let col = 0; col < variables && pivotRow < rows; col++) {
        let bestRow = pivotRow;

        for (let r = pivotRow + 1; r < rows; r++) {
            if (Math.abs(m[r][col]) > Math.abs(m[bestRow][col])) {
                bestRow = r;
            }
        }

        if (Math.abs(m[bestRow][col]) < 0.0000001) {
            continue;
        }

        let temp = m[pivotRow];
        m[pivotRow] = m[bestRow];
        m[bestRow] = temp;

        let pivot = m[pivotRow][col];

        for (let j = col; j < columns; j++) {
            m[pivotRow][j] = m[pivotRow][j] / pivot;
        }

        for (let r = 0; r < rows; r++) {
            if (r !== pivotRow) {
                let factor = m[r][col];

                for (let j = col; j < columns; j++) {
                    m[r][j] = m[r][j] - factor * m[pivotRow][j];
                }
            }
        }

        pivotColumns.push(col);
        pivotRow++;
    }

    return {
        matrix: m.map(row => row.map(cleanNumber)),
        pivotColumns
    };
}

function formatSignedTerm(coefficient, parameter) {
    if (isZero(coefficient)) {
        return "";
    }

    const sign = coefficient > 0 ? " + " : " - ";
    const absoluteValue = Math.abs(coefficient);

    if (isZero(absoluteValue - 1)) {
        return `${sign}${parameter}`;
    }

    return `${sign}${formatNumber(absoluteValue)}${parameter}`;
}

function getVectorForm(rref, pivotColumns, freeColumns, variables, parameterNames) {
    let particular = Array(variables).fill(0);

    for (let row = 0; row < pivotColumns.length; row++) {
        const pivotColumn = pivotColumns[row];
        particular[pivotColumn] = rref[row][variables];
    }

    let text = `X = [${particular.map(formatNumber).join(", ")}]`;

    for (let i = 0; i < freeColumns.length; i++) {
        const freeColumn = freeColumns[i];
        const parameter = parameterNames[i] || `t${i + 1}`;
        let direction = Array(variables).fill(0);

        direction[freeColumn] = 1;

        for (let row = 0; row < pivotColumns.length; row++) {
            const pivotColumn = pivotColumns[row];
            direction[pivotColumn] = -rref[row][freeColumn];
        }

        text += ` + ${parameter}[${direction.map(formatNumber).join(", ")}]`;
    }

    return text;
}

function normalizeFinalMatrix(matrix) {
    const rows = matrix.length;
    const columns = matrix[0].length;
    let normalizedMatrix = cloneMatrix(matrix);

    for (let i = 0; i < rows; i++) {
        const diagonal = matrix[i][i];

        if (!isZero(diagonal)) {
            for (let j = 0; j < columns; j++) {
                normalizedMatrix[i][j] = cleanNumber(matrix[i][j] / diagonal);
            }
        }
    }

    return normalizedMatrix;
}

function getNormalizationText(matrix) {
    const rows = matrix.length;

    let text = "To read the solution clearly, divide each row by its diagonal value.\n\n";

    for (let i = 0; i < rows; i++) {
        const diagonal = matrix[i][i];

        if (!isZero(diagonal)) {
            text += `R${i + 1} = R${i + 1} / ${formatNumber(diagonal)}\n`;
        }
    }

    text += "\nThis turns the diagonal values into 1, so the coefficient matrix becomes the identity matrix.";

    return text;
}

function getNormalizedSolutionText(matrix) {
    const rows = matrix.length;
    const lastColumn = matrix[0].length - 1;

    let text = "The normalized matrix directly shows the solution:\n\n";

    for (let i = 0; i < rows; i++) {
        text += `x${i + 1} = ${formatNumber(matrix[i][lastColumn])}\n`;
    }

    return text;
}
function updateOperationHint() {
    const operation = document.getElementById("operation").value;
    const operationHint = document.getElementById("operationHint");

    if (operation === "inverse") {
        operationHint.textContent = "Inverse matrix creates an augmented matrix in the form [A | I].";
    } else if (operation === "determinant") {
        operationHint.textContent = "Determinant creates a square matrix A and calculates det(A).";
    } else {
        operationHint.textContent = "Solve system creates an augmented matrix with n rows and n + 1 columns.";
    }
}

function getInverseText(matrix, size) {
    let text = "The left side is now the identity matrix.\n";
    text += "Therefore, the right side is the inverse matrix:\n\n";
    text += "A⁻¹ =\n";

    for (let i = 0; i < size; i++) {
        let row = [];

        for (let j = size; j < size * 2; j++) {
            row.push(formatNumber(matrix[i][j]));
        }

        text += `[ ${row.join("   ")} ]\n`;
    }

    return text;
}

function getSingularMatrixText() {
    return `The matrix does not have an inverse.

A zero pivot appeared and no row swap was possible.

This means the matrix is singular, so det(A) = 0.

Therefore, A⁻¹ does not exist.`;
}
function getMontanteDeterminant(matrix, rowSwapCount) {
    let determinant = 0;

    for (let i = 0; i < matrix.length; i++) {
        if (!isZero(matrix[i][i])) {
            determinant = matrix[i][i];
            break;
        }
    }

    if (rowSwapCount % 2 !== 0) {
        determinant = -determinant;
    }

    return cleanNumber(determinant);
}

function getDeterminantText(matrix, determinant, rowSwapCount) {
    let text = "The final matrix is diagonal.\n\n";
    text += "In the Bareiss-Montante method, the diagonal value represents the determinant.\n\n";

    if (rowSwapCount > 0) {
        text += `There were ${rowSwapCount} row swap(s), so the determinant sign is adjusted.\n\n`;
    }

    text += `det(A) = ${formatNumber(determinant)}`;

    return text;
}