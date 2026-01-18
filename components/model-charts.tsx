"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  Cell,
  Legend,
  ReferenceLine,
} from "recharts";
import { Activity, BarChart3, TrendingUp, Layers } from "lucide-react";

interface ChartData {
  actualVsPredicted: { actual: number; predicted: number }[];
  avgPriceByFuelType: { fuel: string; avgPrice: number }[];
  avgPriceByYear: { year: number; avgPrice: number }[];
  residuals: { predicted: number; residual: number }[];
}

interface ModelChartsProps {
  chartData: ChartData | null;
  featureImportance: { feature: string; importance: number }[] | null;
}

const COLORS = [
  "oklch(0.65 0.2 265)",
  "oklch(0.75 0.15 165)",
  "oklch(0.7 0.18 45)",
  "oklch(0.6 0.15 290)",
  "oklch(0.65 0.12 200)",
];

export function ModelCharts({ chartData, featureImportance }: ModelChartsProps) {
  if (!chartData) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-border bg-card">
            <CardContent className="flex h-80 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const topFeatures = featureImportance?.slice(0, 6) || [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Actual vs Predicted Scatter Plot */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Activity className="h-4 w-4 text-chart-1" />
            Actual vs Predicted Prices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.01 260)" />
              <XAxis
                dataKey="actual"
                name="Actual"
                unit="L"
                tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }}
                axisLine={{ stroke: "oklch(0.28 0.01 260)" }}
                label={{
                  value: "Actual Price (Lakh)",
                  position: "bottom",
                  fill: "oklch(0.65 0 0)",
                  fontSize: 11,
                }}
              />
              <YAxis
                dataKey="predicted"
                name="Predicted"
                unit="L"
                tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }}
                axisLine={{ stroke: "oklch(0.28 0.01 260)" }}
                label={{
                  value: "Predicted Price (Lakh)",
                  angle: -90,
                  position: "insideLeft",
                  fill: "oklch(0.65 0 0)",
                  fontSize: 11,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.16 0.01 260)",
                  border: "1px solid oklch(0.28 0.01 260)",
                  borderRadius: "8px",
                  color: "oklch(0.95 0 0)",
                }}
              />
              <ReferenceLine
                segment={[
                  { x: 0, y: 0 },
                  { x: 35, y: 35 },
                ]}
                stroke="oklch(0.75 0.15 165)"
                strokeDasharray="5 5"
                strokeWidth={2}
              />
              <Scatter
                data={chartData.actualVsPredicted}
                fill="oklch(0.65 0.2 265)"
                fillOpacity={0.7}
              />
            </ScatterChart>
          </ResponsiveContainer>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Points closer to the diagonal line indicate better predictions
          </p>
        </CardContent>
      </Card>

      {/* Feature Importance */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Layers className="h-4 w-4 text-chart-2" />
            Feature Importance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={topFeatures}
              layout="vertical"
              margin={{ top: 10, right: 10, bottom: 10, left: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.01 260)" />
              <XAxis
                type="number"
                tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }}
                axisLine={{ stroke: "oklch(0.28 0.01 260)" }}
              />
              <YAxis
                type="category"
                dataKey="feature"
                tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }}
                axisLine={{ stroke: "oklch(0.28 0.01 260)" }}
                width={75}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.16 0.01 260)",
                  border: "1px solid oklch(0.28 0.01 260)",
                  borderRadius: "8px",
                  color: "oklch(0.95 0 0)",
                }}
                formatter={(value: number) => [value.toFixed(3), "Importance"]}
              />
              <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                {topFeatures.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Higher values indicate stronger influence on price prediction
          </p>
        </CardContent>
      </Card>

      {/* Average Price by Year */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <TrendingUp className="h-4 w-4 text-chart-3" />
            Average Price Trend by Year
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={chartData.avgPriceByYear}
              margin={{ top: 10, right: 10, bottom: 20, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.01 260)" />
              <XAxis
                dataKey="year"
                tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }}
                axisLine={{ stroke: "oklch(0.28 0.01 260)" }}
                label={{
                  value: "Year",
                  position: "bottom",
                  fill: "oklch(0.65 0 0)",
                  fontSize: 11,
                }}
              />
              <YAxis
                tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }}
                axisLine={{ stroke: "oklch(0.28 0.01 260)" }}
                label={{
                  value: "Avg Price (Lakh)",
                  angle: -90,
                  position: "insideLeft",
                  fill: "oklch(0.65 0 0)",
                  fontSize: 11,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.16 0.01 260)",
                  border: "1px solid oklch(0.28 0.01 260)",
                  borderRadius: "8px",
                  color: "oklch(0.95 0 0)",
                }}
                formatter={(value: number) => [`₹${value.toFixed(2)} Lakh`, "Avg Price"]}
              />
              <Line
                type="monotone"
                dataKey="avgPrice"
                stroke="oklch(0.7 0.18 45)"
                strokeWidth={2}
                dot={{ fill: "oklch(0.7 0.18 45)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "oklch(0.7 0.18 45)" }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Newer cars generally command higher resale prices
          </p>
        </CardContent>
      </Card>

      {/* Average Price by Fuel Type */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <BarChart3 className="h-4 w-4 text-chart-4" />
            Average Price by Fuel Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={chartData.avgPriceByFuelType}
              margin={{ top: 10, right: 10, bottom: 20, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.01 260)" />
              <XAxis
                dataKey="fuel"
                tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }}
                axisLine={{ stroke: "oklch(0.28 0.01 260)" }}
              />
              <YAxis
                tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }}
                axisLine={{ stroke: "oklch(0.28 0.01 260)" }}
                label={{
                  value: "Avg Price (Lakh)",
                  angle: -90,
                  position: "insideLeft",
                  fill: "oklch(0.65 0 0)",
                  fontSize: 11,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.16 0.01 260)",
                  border: "1px solid oklch(0.28 0.01 260)",
                  borderRadius: "8px",
                  color: "oklch(0.95 0 0)",
                }}
                formatter={(value: number) => [`₹${value.toFixed(2)} Lakh`, "Avg Price"]}
              />
              <Legend wrapperStyle={{ color: "oklch(0.65 0 0)" }} />
              <Bar dataKey="avgPrice" name="Average Price" radius={[4, 4, 0, 0]}>
                {chartData.avgPriceByFuelType.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Diesel vehicles often have higher average prices due to better mileage
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
