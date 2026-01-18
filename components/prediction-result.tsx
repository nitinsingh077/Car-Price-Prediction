"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, TrendingUp, Sparkles } from "lucide-react";

interface PredictionResultProps {
  prediction: {
    price: number;
    priceFormatted: string;
  } | null;
  isLoading: boolean;
}

export function PredictionResult({
  prediction,
  isLoading,
}: PredictionResultProps) {
  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Sparkles className="h-5 w-5 text-primary" />
          Predicted Price
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-primary/5 rounded-xl" />

          <div className="relative p-6 text-center">
            {isLoading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground">
                  Analyzing vehicle data...
                </p>
              </div>
            ) : prediction ? (
              <>
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                  <IndianRupee className="h-4 w-4" />
                  <span className="text-sm">Estimated Market Value</span>
                </div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-primary">
                    {prediction.price.toFixed(2)}
                  </span>
                  <span className="text-2xl font-medium text-muted-foreground">
                    Lakh
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-accent">
                  <TrendingUp className="h-4 w-4" />
                  <span>ML Prediction with 85%+ accuracy</span>
                </div>
              </>
            ) : (
              <div className="py-8">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
                  <IndianRupee className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Fill in the vehicle details and click "Predict Price" to get
                  an estimate
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
