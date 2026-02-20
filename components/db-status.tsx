"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";

interface DbStatus {
  supabaseConnected: boolean;
  supabaseRecords: number | null;
  inMemoryRecords: number;
  modelTrained: boolean;
}

export function DbStatus() {
  const [status, setStatus] = useState<DbStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initMessage, setInitMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/db/init");
      const data = await res.json();
      if (data.success) {
        setStatus(data.status);
      }
    } catch (err) {
      console.error("Failed to fetch DB status:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDb = async () => {
    setIsInitializing(true);
    setInitMessage(null);
    try {
      const res = await fetch("/api/db/init", { method: "POST" });
      const data = await res.json();
      setInitMessage(data.message);
      // Refresh status
      await fetchStatus();
    } catch (err) {
      setInitMessage("Failed to initialize database");
      console.error(err);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Database className="h-5 w-5 text-primary" />
          Database Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking connection...
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {/* Supabase Connection */}
              <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                <div className="flex items-center gap-2">
                  {status?.supabaseConnected ? (
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-sm font-medium text-foreground">
                    Supabase Connection
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {status?.supabaseConnected ? "Connected" : "Disconnected"}
                </span>
              </div>

              {/* Supabase Records */}
              <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                <span className="text-sm font-medium text-foreground">
                  Supabase Records
                </span>
                <span className="text-sm font-mono text-chart-1">
                  {status?.supabaseRecords ?? "N/A"}
                </span>
              </div>

              {/* In-Memory Records */}
              <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                <span className="text-sm font-medium text-foreground">
                  In-Memory Records
                </span>
                <span className="text-sm font-mono text-chart-2">
                  {status?.inMemoryRecords ?? 0}
                </span>
              </div>

              {/* Model Status */}
              <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                <div className="flex items-center gap-2">
                  {status?.modelTrained ? (
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium text-foreground">
                    ML Model
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {status?.modelTrained ? "Trained" : "Not trained yet"}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStatus}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </Button>
              {status?.supabaseConnected &&
                (status?.supabaseRecords === null ||
                  status.supabaseRecords === 0) && (
                  <Button
                    size="sm"
                    onClick={initializeDb}
                    disabled={isInitializing}
                    className="gap-2"
                  >
                    {isInitializing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Database className="h-3 w-3" />
                    )}
                    Seed Database
                  </Button>
                )}
            </div>

            {/* Status Message */}
            {initMessage && (
              <p className="text-xs text-muted-foreground rounded-lg bg-secondary p-2">
                {initMessage}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
