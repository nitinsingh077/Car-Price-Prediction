"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { PredictionForm } from "@/components/prediction-form";
import { PredictionResult } from "@/components/prediction-result";
import { StatsCards } from "@/components/stats-cards";
import { ModelCharts } from "@/components/model-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calculator,
  BarChart3,
  Info,
  Cpu,
  Database,
  Zap,
  Target,
  TrendingUp,
} from "lucide-react";

interface ModelInfo {
  metrics: {
    train: { r2Score: number; mse: number; rmse: number; mae: number };
    test: { r2Score: number; mse: number; rmse: number; mae: number };
  };
  featureImportance: { feature: string; importance: number }[];
  statistics: {
    totalRecords: number;
    avgSellingPrice: number;
    avgPresentPrice: number;
    avgKmsDriven: number;
    fuelTypeDistribution: Record<string, number>;
    transmissionDistribution: Record<string, number>;
    yearRange: { min: number; max: number };
    priceRange: { min: number; max: number };
  };
}

interface ChartData {
  actualVsPredicted: { actual: number; predicted: number }[];
  avgPriceByFuelType: { fuel: string; avgPrice: number }[];
  avgPriceByYear: { year: number; avgPrice: number }[];
  residuals: { predicted: number; residual: number }[];
}

export default function Home() {
  const [prediction, setPrediction] = useState<{
    price: number;
    priceFormatted: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);

  useEffect(() => {
    // Fetch model info on load
    fetch("/api/model")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setModelInfo(data.modelInfo);
        }
      })
      .catch(console.error);

    // Fetch chart data
    fetch("/api/charts")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setChartData(data.chartData);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl text-balance">
            Car Price Prediction
          </h2>
          <p className="mt-2 text-muted-foreground text-pretty max-w-2xl">
            Leverage machine learning to accurately estimate the resale value of
            any vehicle. Our model analyzes key features like age, mileage, fuel
            type, and more.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8">
          <StatsCards
            statistics={modelInfo?.statistics || null}
            metrics={modelInfo?.metrics || null}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="predict" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="predict" className="gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Predict Price</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="model" className="gap-2">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Model Info</span>
            </TabsTrigger>
          </TabsList>

          {/* Predict Tab */}
          <TabsContent value="predict" id="predict">
            <div className="grid gap-6 lg:grid-cols-2">
              <PredictionForm
                onPredict={setPrediction}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
              <PredictionResult prediction={prediction} isLoading={isLoading} />
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" id="analytics">
            <ModelCharts
              chartData={chartData}
              featureImportance={modelInfo?.featureImportance || null}
            />
          </TabsContent>

          {/* Model Info Tab */}
          <TabsContent value="model" id="model">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Algorithm Info */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <Cpu className="h-5 w-5 text-primary" />
                    Algorithm Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-secondary p-4">
                    <h4 className="font-medium text-foreground">
                      Multiple Linear Regression
                    </h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      A supervised learning algorithm that models the
                      relationship between multiple independent variables and a
                      continuous target variable.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-chart-1/10 p-2">
                        <Target className="h-4 w-4 text-chart-1" />
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-foreground">
                          Normal Equation
                        </h5>
                        <p className="text-xs text-muted-foreground">
                          {'Uses the closed-form solution: θ = (XᵀX)⁻¹Xᵀy'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-chart-2/10 p-2">
                        <Zap className="h-4 w-4 text-chart-2" />
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-foreground">
                          Ridge Regularization
                        </h5>
                        <p className="text-xs text-muted-foreground">
                          L2 regularization applied for numerical stability
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-chart-3/10 p-2">
                        <TrendingUp className="h-4 w-4 text-chart-3" />
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-foreground">
                          Feature Scaling
                        </h5>
                        <p className="text-xs text-muted-foreground">
                          Z-score standardization for all numerical features
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Processing */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <Database className="h-5 w-5 text-primary" />
                    Data Processing Pipeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative pl-6 border-l-2 border-border">
                      <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-chart-1" />
                      <h5 className="font-medium text-foreground">
                        1. Data Collection
                      </h5>
                      <p className="text-sm text-muted-foreground">
                        {modelInfo?.statistics.totalRecords || 0} vehicle
                        records with 9 features
                      </p>
                    </div>
                    <div className="relative pl-6 border-l-2 border-border">
                      <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-chart-2" />
                      <h5 className="font-medium text-foreground">
                        2. Feature Engineering
                      </h5>
                      <p className="text-sm text-muted-foreground">
                        One-hot encoding for categorical variables, age
                        calculation
                      </p>
                    </div>
                    <div className="relative pl-6 border-l-2 border-border">
                      <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-chart-3" />
                      <h5 className="font-medium text-foreground">
                        3. Data Preprocessing
                      </h5>
                      <p className="text-sm text-muted-foreground">
                        Z-score normalization, 80/20 train-test split
                      </p>
                    </div>
                    <div className="relative pl-6 border-l-2 border-border">
                      <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-chart-4" />
                      <h5 className="font-medium text-foreground">
                        4. Model Training
                      </h5>
                      <p className="text-sm text-muted-foreground">
                        Ridge regression with λ=0.01 regularization
                      </p>
                    </div>
                    <div className="relative pl-6">
                      <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-chart-5" />
                      <h5 className="font-medium text-foreground">
                        5. Model Evaluation
                      </h5>
                      <p className="text-sm text-muted-foreground">
                        R², RMSE, MAE metrics on test set
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Model Performance */}
              <Card className="border-border bg-card lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Model Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg bg-secondary p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Train R² Score
                      </p>
                      <p className="mt-1 text-2xl font-bold text-chart-1">
                        {modelInfo
                          ? `${(modelInfo.metrics.train.r2Score * 100).toFixed(1)}%`
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-secondary p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Test R² Score
                      </p>
                      <p className="mt-1 text-2xl font-bold text-chart-2">
                        {modelInfo
                          ? `${(modelInfo.metrics.test.r2Score * 100).toFixed(1)}%`
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-secondary p-4 text-center">
                      <p className="text-sm text-muted-foreground">Train RMSE</p>
                      <p className="mt-1 text-2xl font-bold text-chart-3">
                        {modelInfo
                          ? `₹${modelInfo.metrics.train.rmse.toFixed(2)}L`
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-secondary p-4 text-center">
                      <p className="text-sm text-muted-foreground">Test RMSE</p>
                      <p className="mt-1 text-2xl font-bold text-chart-4">
                        {modelInfo
                          ? `₹${modelInfo.metrics.test.rmse.toFixed(2)}L`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="mt-12 border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Built with Next.js, TypeScript, and Machine Learning algorithms
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Model trained on {modelInfo?.statistics.totalRecords || 0} vehicle
            records from the Indian automobile market
          </p>
        </footer>
      </main>
    </div>
  );
}
