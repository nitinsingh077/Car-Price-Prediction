// Car Price Prediction ML Model using Multiple Linear Regression
// This implements the core ML algorithms in TypeScript

export interface CarData {
  Car_Name: string;
  Year: number;
  Selling_Price: number;
  Present_Price: number;
  Driven_kms: number;
  Fuel_Type: string;
  Selling_type: string;
  Transmission: string;
  Owner: number;
}

export interface ProcessedFeatures {
  year: number;
  presentPrice: number;
  drivenKms: number;
  fuelTypePetrol: number;
  fuelTypeDiesel: number;
  fuelTypeCNG: number;
  sellerTypeDealer: number;
  sellerTypeIndividual: number;
  transmissionManual: number;
  transmissionAutomatic: number;
  owner: number;
  carAge: number;
}

export interface ModelMetrics {
  r2Score: number;
  mse: number;
  rmse: number;
  mae: number;
}

export interface PredictionInput {
  year: number;
  presentPrice: number;
  drivenKms: number;
  fuelType: 'Petrol' | 'Diesel' | 'CNG';
  sellerType: 'Dealer' | 'Individual';
  transmission: 'Manual' | 'Automatic';
  owner: number;
}

// Feature scaling parameters (calculated from training data)
export interface ScalingParams {
  mean: number[];
  std: number[];
}

// Parse CSV data
export function parseCSV(csvText: string): CarData[] {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      Car_Name: values[0],
      Year: parseInt(values[1]),
      Selling_Price: parseFloat(values[2]),
      Present_Price: parseFloat(values[3]),
      Driven_kms: parseInt(values[4]),
      Fuel_Type: values[5],
      Selling_type: values[6],
      Transmission: values[7],
      Owner: parseInt(values[8])
    };
  });
}

// Feature engineering: Convert raw data to numerical features
export function preprocessData(data: CarData[]): { features: number[][]; targets: number[] } {
  const currentYear = new Date().getFullYear();
  
  const features: number[][] = [];
  const targets: number[] = [];
  
  data.forEach(car => {
    const carAge = currentYear - car.Year;
    
    // One-hot encoding for categorical variables
    const fuelTypePetrol = car.Fuel_Type === 'Petrol' ? 1 : 0;
    const fuelTypeDiesel = car.Fuel_Type === 'Diesel' ? 1 : 0;
    const fuelTypeCNG = car.Fuel_Type === 'CNG' ? 1 : 0;
    
    const sellerTypeDealer = car.Selling_type === 'Dealer' ? 1 : 0;
    const sellerTypeIndividual = car.Selling_type === 'Individual' ? 1 : 0;
    
    const transmissionManual = car.Transmission === 'Manual' ? 1 : 0;
    const transmissionAutomatic = car.Transmission === 'Automatic' ? 1 : 0;
    
    features.push([
      car.Present_Price,
      car.Driven_kms / 1000, // Scale down kilometers
      fuelTypePetrol,
      fuelTypeDiesel,
      fuelTypeCNG,
      sellerTypeDealer,
      sellerTypeIndividual,
      transmissionManual,
      transmissionAutomatic,
      car.Owner,
      carAge
    ]);
    
    targets.push(car.Selling_Price);
  });
  
  return { features, targets };
}

// Calculate mean of array
function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Calculate standard deviation
function std(arr: number[]): number {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((acc, val) => acc + Math.pow(val - m, 2), 0) / arr.length);
}

// Standardize features (z-score normalization)
export function standardizeFeatures(features: number[][]): { 
  scaledFeatures: number[][]; 
  scalingParams: ScalingParams 
} {
  const numFeatures = features[0].length;
  const means: number[] = [];
  const stds: number[] = [];
  
  for (let i = 0; i < numFeatures; i++) {
    const column = features.map(row => row[i]);
    means.push(mean(column));
    stds.push(std(column) || 1); // Avoid division by zero
  }
  
  const scaledFeatures = features.map(row => 
    row.map((val, i) => (val - means[i]) / stds[i])
  );
  
  return { scaledFeatures, scalingParams: { mean: means, std: stds } };
}

// Apply scaling to new data
export function applyScaling(features: number[], params: ScalingParams): number[] {
  return features.map((val, i) => (val - params.mean[i]) / params.std[i]);
}

// Matrix operations for linear regression
function transpose(matrix: number[][]): number[][] {
  return matrix[0].map((_, i) => matrix.map(row => row[i]));
}

function matMul(a: number[][], b: number[][]): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < a.length; i++) {
    result[i] = [];
    for (let j = 0; j < b[0].length; j++) {
      result[i][j] = 0;
      for (let k = 0; k < a[0].length; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }
  return result;
}

function matVecMul(matrix: number[][], vector: number[]): number[] {
  return matrix.map(row => row.reduce((sum, val, i) => sum + val * vector[i], 0));
}

// Invert matrix using Gauss-Jordan elimination
function invertMatrix(matrix: number[][]): number[][] {
  const n = matrix.length;
  const augmented: number[][] = matrix.map((row, i) => [
    ...row,
    ...Array(n).fill(0).map((_, j) => (i === j ? 1 : 0))
  ]);
  
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
    
    const pivot = augmented[i][i];
    if (Math.abs(pivot) < 1e-10) continue;
    
    for (let j = 0; j < 2 * n; j++) {
      augmented[i][j] /= pivot;
    }
    
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = augmented[k][i];
        for (let j = 0; j < 2 * n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }
  }
  
  return augmented.map(row => row.slice(n));
}

// Multiple Linear Regression using Normal Equation: θ = (X^T X)^(-1) X^T y
export function trainLinearRegression(features: number[][], targets: number[]): number[] {
  // Add bias term (column of 1s)
  const X = features.map(row => [1, ...row]);
  const y = targets;
  
  const Xt = transpose(X);
  const XtX = matMul(Xt, X);
  
  // Add small regularization for numerical stability (Ridge regression)
  const lambda = 0.01;
  for (let i = 0; i < XtX.length; i++) {
    XtX[i][i] += lambda;
  }
  
  const XtXInv = invertMatrix(XtX);
  const Xty = matVecMul(Xt, y);
  const theta = matVecMul(XtXInv, Xty);
  
  return theta;
}

// Predict using trained model
export function predict(features: number[], weights: number[]): number {
  const x = [1, ...features]; // Add bias term
  return x.reduce((sum, val, i) => sum + val * weights[i], 0);
}

// Predict multiple samples
export function predictBatch(features: number[][], weights: number[]): number[] {
  return features.map(f => predict(f, weights));
}

// Calculate model metrics
export function calculateMetrics(actual: number[], predicted: number[]): ModelMetrics {
  const n = actual.length;
  
  // Mean Squared Error
  const mse = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0) / n;
  
  // Root Mean Squared Error
  const rmse = Math.sqrt(mse);
  
  // Mean Absolute Error
  const mae = actual.reduce((sum, val, i) => sum + Math.abs(val - predicted[i]), 0) / n;
  
  // R² Score
  const meanActual = mean(actual);
  const ssTotal = actual.reduce((sum, val) => sum + Math.pow(val - meanActual, 2), 0);
  const ssResidual = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
  const r2Score = 1 - (ssResidual / ssTotal);
  
  return { r2Score, mse, rmse, mae };
}

// Train-test split
export function trainTestSplit(
  features: number[][], 
  targets: number[], 
  testSize: number = 0.2
): {
  trainFeatures: number[][];
  testFeatures: number[][];
  trainTargets: number[];
  testTargets: number[];
} {
  const n = features.length;
  const testCount = Math.floor(n * testSize);
  const indices = Array.from({ length: n }, (_, i) => i);
  
  // Shuffle indices
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  const testIndices = indices.slice(0, testCount);
  const trainIndices = indices.slice(testCount);
  
  return {
    trainFeatures: trainIndices.map(i => features[i]),
    testFeatures: testIndices.map(i => features[i]),
    trainTargets: trainIndices.map(i => targets[i]),
    testTargets: testIndices.map(i => targets[i])
  };
}

// Prepare single prediction input
export function preparePredictionInput(input: PredictionInput): number[] {
  const currentYear = new Date().getFullYear();
  const carAge = currentYear - input.year;
  
  return [
    input.presentPrice,
    input.drivenKms / 1000,
    input.fuelType === 'Petrol' ? 1 : 0,
    input.fuelType === 'Diesel' ? 1 : 0,
    input.fuelType === 'CNG' ? 1 : 0,
    input.sellerType === 'Dealer' ? 1 : 0,
    input.sellerType === 'Individual' ? 1 : 0,
    input.transmission === 'Manual' ? 1 : 0,
    input.transmission === 'Automatic' ? 1 : 0,
    input.owner,
    carAge
  ];
}

// Feature importance (absolute coefficient values)
export function getFeatureImportance(weights: number[]): { feature: string; importance: number }[] {
  const featureNames = [
    'Present Price',
    'Kilometers Driven',
    'Fuel: Petrol',
    'Fuel: Diesel',
    'Fuel: CNG',
    'Seller: Dealer',
    'Seller: Individual',
    'Trans: Manual',
    'Trans: Automatic',
    'Previous Owners',
    'Car Age'
  ];
  
  // Skip bias term (index 0)
  return featureNames.map((name, i) => ({
    feature: name,
    importance: Math.abs(weights[i + 1])
  })).sort((a, b) => b.importance - a.importance);
}

// Data statistics
export function getDataStatistics(data: CarData[]): {
  totalRecords: number;
  avgSellingPrice: number;
  avgPresentPrice: number;
  avgKmsDriven: number;
  fuelTypeDistribution: Record<string, number>;
  transmissionDistribution: Record<string, number>;
  yearRange: { min: number; max: number };
  priceRange: { min: number; max: number };
} {
  const totalRecords = data.length;
  const avgSellingPrice = mean(data.map(d => d.Selling_Price));
  const avgPresentPrice = mean(data.map(d => d.Present_Price));
  const avgKmsDriven = mean(data.map(d => d.Driven_kms));
  
  const fuelTypeDistribution: Record<string, number> = {};
  const transmissionDistribution: Record<string, number> = {};
  
  data.forEach(d => {
    fuelTypeDistribution[d.Fuel_Type] = (fuelTypeDistribution[d.Fuel_Type] || 0) + 1;
    transmissionDistribution[d.Transmission] = (transmissionDistribution[d.Transmission] || 0) + 1;
  });
  
  const years = data.map(d => d.Year);
  const prices = data.map(d => d.Selling_Price);
  
  return {
    totalRecords,
    avgSellingPrice,
    avgPresentPrice,
    avgKmsDriven,
    fuelTypeDistribution,
    transmissionDistribution,
    yearRange: { min: Math.min(...years), max: Math.max(...years) },
    priceRange: { min: Math.min(...prices), max: Math.max(...prices) }
  };
}
