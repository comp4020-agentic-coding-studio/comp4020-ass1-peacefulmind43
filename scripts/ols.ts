// Ordinary least squares via the normal equations: for a design matrix X
// (rows = observations, columns = predictors, including an intercept column
// of 1s if you want one) and target y, the coefficients that minimise
// squared error solve (X^T X) beta = X^T y. Solved here by Gauss-Jordan
// elimination with partial pivoting -- no numeric dependency, and small
// enough (predictor count, not row count, sets the matrix size) to be fast
// even over tens of thousands of rows.

function transpose(matrix: number[][]): number[][] {
  return matrix[0].map((_, col) => matrix.map((row) => row[col]));
}

function multiply(a: number[][], b: number[][]): number[][] {
  return a.map((row) => b[0].map((_, j) => row.reduce((sum, v, k) => sum + v * b[k][j], 0)));
}

function multiplyVector(a: number[][], v: number[]): number[] {
  return a.map((row) => row.reduce((sum, value, i) => sum + value * v[i], 0));
}

// Solves A x = b for x via Gauss-Jordan elimination with partial pivoting on
// the augmented [A | b] matrix.
function solveLinearSystem(a: number[][], b: number[]): number[] {
  const n = a.length;
  const augmented = a.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[pivotRow][col])) pivotRow = row;
    }
    if (Math.abs(augmented[pivotRow][col]) < 1e-12) {
      throw new Error(`singular matrix: no usable pivot in column ${col}`);
    }
    [augmented[col], augmented[pivotRow]] = [augmented[pivotRow], augmented[col]];

    const pivot = augmented[col][col];
    for (let k = col; k <= n; k++) augmented[col][k] /= pivot;

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = augmented[row][col];
      for (let k = col; k <= n; k++) augmented[row][k] -= factor * augmented[col][k];
    }
  }

  return augmented.map((row) => row[n]);
}

export function solveOLS(x: number[][], y: number[]): number[] {
  const xT = transpose(x);
  const xTx = multiply(xT, x);
  const xTy = multiplyVector(xT, y);
  return solveLinearSystem(xTx, xTy);
}
