"use client";

import { Car, Brain, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Car className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">CarML</h1>
            <p className="text-xs text-muted-foreground">
              Price Prediction Engine
            </p>
          </div>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          <a
            href="#predict"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Predict
          </a>
          <a
            href="#analytics"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Analytics
          </a>
          <a
            href="#model"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Model Info
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full bg-secondary px-3 py-1.5 md:flex">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-foreground">
              ML Powered
            </span>
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9 bg-transparent">
            <Github className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
