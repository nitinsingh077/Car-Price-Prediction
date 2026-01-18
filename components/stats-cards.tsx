"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Database,
  TrendingUp,
  Car,
  Target,
  BarChart3,
  Percent,
} from "lucide-react";

interface StatsCardsProps {
  statistics: {
    totalRecords: number;
    avgSellingPrice: number;
    avgPresentPrice: number;
    avgKmsDriven: number;
    priceRange: { min: number; max: number };
  } | null;
  metrics: {
    test: {
      r2Score: number;
      rmse: number;
      mae: number;
    };
  } | null;
}

export function StatsCards({ statistics, metrics }: StatsCardsProps) {
  const stats = [
    {
      label: "Training Samples",
      value: statistics?.totalRecords.toLocaleString() || "—",
      icon: Database,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      label: "R² Score",
      value: metrics ? `${(metrics.test.r2Score * 100).toFixed(1)}%` : "—",
      icon: Target,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      label: "RMSE",
      value: metrics ? `₹${metrics.test.rmse.toFixed(2)}L` : "—",
      icon: BarChart3,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      label: "Avg. Selling Price",
      value: statistics ? `₹${statistics.avgSellingPrice.toFixed(2)}L` : "—",
      icon: TrendingUp,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
    {
      label: "Price Range",
      value: statistics
        ? `₹${statistics.priceRange.min.toFixed(1)} - ₹${statistics.priceRange.max.toFixed(1)}L`
        : "—",
      icon: Car,
      color: "text-chart-5",
      bgColor: "bg-chart-5/10",
    },
    {
      label: "MAE",
      value: metrics ? `₹${metrics.test.mae.toFixed(2)}L` : "—",
      icon: Percent,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">
                  {stat.label}
                </p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {stat.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
