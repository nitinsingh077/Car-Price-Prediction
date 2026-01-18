"use client";

import { useState, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Car, Gauge, Calendar, Fuel, Users, Settings } from "lucide-react";

interface PredictionFormProps {
  onPredict: (prediction: { price: number; priceFormatted: string }) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function PredictionForm({
  onPredict,
  isLoading,
  setIsLoading,
}: PredictionFormProps) {
  const [formData, setFormData] = useState({
    year: 2020,
    presentPrice: 10,
    drivenKms: 30000,
    fuelType: "Petrol" as "Petrol" | "Diesel" | "CNG",
    sellerType: "Dealer" as "Dealer" | "Individual",
    transmission: "Manual" as "Manual" | "Automatic",
    owner: 0,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        onPredict(data.prediction);
      }
    } catch (error) {
      console.error("Prediction failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 25 }, (_, i) => currentYear - i);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Car className="h-5 w-5 text-primary" />
          Vehicle Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Year */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Manufacturing Year
              </Label>
              <Select
                value={formData.year.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, year: parseInt(value) })
                }
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Present Price */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <span className="text-sm font-medium">₹</span>
                Ex-Showroom Price (Lakh)
              </Label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                value={formData.presentPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    presentPrice: parseFloat(e.target.value) || 0,
                  })
                }
                className="bg-secondary border-border"
              />
            </div>

            {/* Kilometers Driven */}
            <div className="space-y-3 md:col-span-2">
              <Label className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Kilometers Driven
                </span>
                <span className="text-sm font-medium text-foreground">
                  {formData.drivenKms.toLocaleString()} km
                </span>
              </Label>
              <Slider
                value={[formData.drivenKms]}
                onValueChange={([value]) =>
                  setFormData({ ...formData, drivenKms: value })
                }
                min={0}
                max={200000}
                step={1000}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 km</span>
                <span>200,000 km</span>
              </div>
            </div>

            {/* Fuel Type */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Fuel className="h-4 w-4" />
                Fuel Type
              </Label>
              <Select
                value={formData.fuelType}
                onValueChange={(value: "Petrol" | "Diesel" | "CNG") =>
                  setFormData({ ...formData, fuelType: value })
                }
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Petrol">Petrol</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="CNG">CNG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Transmission */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Settings className="h-4 w-4" />
                Transmission
              </Label>
              <Select
                value={formData.transmission}
                onValueChange={(value: "Manual" | "Automatic") =>
                  setFormData({ ...formData, transmission: value })
                }
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manual">Manual</SelectItem>
                  <SelectItem value="Automatic">Automatic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seller Type */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                Seller Type
              </Label>
              <Select
                value={formData.sellerType}
                onValueChange={(value: "Dealer" | "Individual") =>
                  setFormData({ ...formData, sellerType: value })
                }
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dealer">Dealer</SelectItem>
                  <SelectItem value="Individual">Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Previous Owners */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                Previous Owners
              </Label>
              <Select
                value={formData.owner.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, owner: parseInt(value) })
                }
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">First Owner</SelectItem>
                  <SelectItem value="1">Second Owner</SelectItem>
                  <SelectItem value="2">Third Owner</SelectItem>
                  <SelectItem value="3">Fourth+ Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Predicting...
              </span>
            ) : (
              "Predict Price"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
