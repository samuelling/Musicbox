// Small dense linear algebra for the generalized symmetric eigenproblem
// K x = lambda M x that the beam finite-element model produces.
// Matrices are row-major Float64Arrays of size n*n.

export function cholesky(A, n) {
  const L = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = A[i * n + j];
      for (let k = 0; k < j; k++) s -= L[i * n + k] * L[j * n + k];
      if (i === j) {
        if (!(s > 0)) throw new Error('matrix not positive definite');
        L[i * n + i] = Math.sqrt(s);
      } else L[i * n + j] = s / L[j * n + j];
    }
  }
  return L;
}

// Solve L Y = B (L lower triangular), B given column-major via accessor. Returns row-major Y.
function solveLowerMat(L, B, n) {
  const Y = new Float64Array(n * n);
  for (let c = 0; c < n; c++) {
    for (let i = 0; i < n; i++) {
      let s = B[i * n + c];
      for (let k = 0; k < i; k++) s -= L[i * n + k] * Y[k * n + c];
      Y[i * n + c] = s / L[i * n + i];
    }
  }
  return Y;
}

// Cyclic Jacobi eigenvalue algorithm for a symmetric matrix.
export function jacobiEigen(Ain, n) {
  const a = Float64Array.from(Ain);
  const v = new Float64Array(n * n);
  for (let i = 0; i < n; i++) v[i * n + i] = 1;
  let norm = 0;
  for (let i = 0; i < n * n; i++) norm += a[i] * a[i];
  for (let sweep = 0; sweep < 80; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p * n + q] * a[p * n + q];
    if (off < 1e-26 * norm) break;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        const apq = a[p * n + q];
        if (Math.abs(apq) < 1e-300) continue;
        const app = a[p * n + p], aqq = a[q * n + q];
        const theta = (aqq - app) / (2 * apq);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (let k = 0; k < n; k++) {
          const akp = a[k * n + p], akq = a[k * n + q];
          a[k * n + p] = c * akp - s * akq;
          a[k * n + q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = a[p * n + k], aqk = a[q * n + k];
          a[p * n + k] = c * apk - s * aqk;
          a[q * n + k] = s * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = v[k * n + p], vkq = v[k * n + q];
          v[k * n + p] = c * vkp - s * vkq;
          v[k * n + q] = s * vkp + c * vkq;
        }
      }
    }
  }
  const values = new Float64Array(n);
  for (let i = 0; i < n; i++) values[i] = a[i * n + i];
  return { values, vectors: v };
}

// Generalized problem K x = lambda M x. Returns eigenvalues ascending and
// M-orthonormal eigenvectors (x^T M x = 1), as an array of Float64Arrays.
export function generalizedEigen(K, M, n) {
  const L = cholesky(M, n);
  const Y = solveLowerMat(L, K, n);          // L^-1 K
  const Yt = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) Yt[i * n + j] = Y[j * n + i];
  const C = solveLowerMat(L, Yt, n);         // L^-1 K L^-T
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const m = 0.5 * (C[i * n + j] + C[j * n + i]); C[i * n + j] = m; C[j * n + i] = m;
  }
  const { values, vectors } = jacobiEigen(C, n);
  const order = Array.from(values.keys()).sort((p, q) => values[p] - values[q]);
  const vals = [], vecs = [];
  for (const idx of order) {
    const y = new Float64Array(n);
    for (let i = 0; i < n; i++) y[i] = vectors[i * n + idx];
    // back-substitute L^T x = y
    const x = new Float64Array(n);
    for (let i = n - 1; i >= 0; i--) {
      let s = y[i];
      for (let k = i + 1; k < n; k++) s -= L[k * n + i] * x[k];
      x[i] = s / L[i * n + i];
    }
    vals.push(values[idx]); vecs.push(x);
  }
  return { values: vals, vectors: vecs };
}
