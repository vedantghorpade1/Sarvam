"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Bot,
  Volume2,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";

const COLORS = {
  background: "#111111",
  primaryHeadline: "#F3FFD4",
  textSecondary: "#A7A7A7",
  accent: "#A7B3AC",
  border: "#333333",
  white: "#FFFFFF",
};

export default function AgentDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const res = await fetch(`/api/getAgents/${id}`);
        if (!res.ok) throw new Error("Failed to fetch agent details");
        const data = await res.json();
        setAgent(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAgent();
  }, [id]);

  // 🧩 Loading Skeleton
  if (loading) {
    return (
      <div className="min-h-screen flex text-foreground">
        <main className="flex-1 h-fit max-h-screen overflow-y-auto bg-background">
        <DashboardHeader />

          <div className="container mx-auto px-4 sm:px-6 py-8">
            <div className="max-w-5xl mx-auto space-y-6">
              <Skeleton className="h-8 w-40 mb-2" />
              <Skeleton className="h-6 w-56 mb-4" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ❌ Error Display
  if (error) {
    return (
      <div className="min-h-screen flex text-foreground">
      
        <main className="flex-1 h-fit max-h-screen overflow-y-auto bg-background">
        <DashboardHeader />

          <div className="container mx-auto px-4 sm:px-6 py-8">
            <div className="max-w-5xl mx-auto">
              <Button
                variant="ghost"
                className="mb-4"
                onClick={() => router.push("/dashboard/agents")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Agents
              </Button>

              <Card className="border-destructive bg-[#1a0000]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Error Loading Agent
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {error}
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ✅ Main Agent Details
  return (
    <div className="min-h-screen flex text-foreground" style={{ backgroundColor: COLORS.background }}>
   

      <main className="flex-1 h-fit max-h-screen overflow-y-auto bg-background">
        <DashboardHeader />

        <div className="container mx-auto px-4 sm:px-6 py-8 text-white">
          <div className="max-w-5xl mx-auto">
            {/* Back Button */}
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => router.push("/dashboard/agents")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Agents
            </Button>

            {/* Agent Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-full flex items-center justify-center bg-[#1f1f1f] border border-[#333]">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{ color: COLORS.primaryHeadline }}>
                  {agent.name || "Unnamed Agent"}
                </h1>
                {agent.disabled && (
                  <Badge
                    variant="outline"
                    className="text-muted-foreground border-muted-foreground mt-1"
                  >
                    Disabled
                  </Badge>
                )}
              </div>
            </div>

            {/* Description */}
            {agent.description && (
              <Card className="mb-6 border-[#333] bg-[#141414]">
                <CardHeader>
                  <CardTitle style={{ color: COLORS.primaryHeadline }}>
                    Agent Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p style={{ color: COLORS.textSecondary }}>
                    {agent.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Voice Info */}
            <Card className="mb-6 border-[#333] bg-[#141414]">
              <CardHeader>
                <CardTitle style={{ color: COLORS.primaryHeadline }}>
                  Voice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-primary/10">
                  <Volume2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: COLORS.white }}>
                    {agent.voiceName || "No voice assigned"}
                  </h2>
                  <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                    Voice ID: {agent.voice_id || "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Knowledge Base */}
            <Card className="border-[#333] bg-[#141414]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: COLORS.primaryHeadline }}>
                  <FileText className="h-5 w-5 text-primary" />
                  Knowledge Documents
                </CardTitle>
                <CardDescription style={{ color: COLORS.textSecondary }}>
                  Documents linked to this agent’s knowledge base
                </CardDescription>
              </CardHeader>
              <CardContent>
                {agent.knowledge && agent.knowledge.length > 0 ? (
                  <ul className="space-y-2 list-disc pl-6">
                    {agent.knowledge.map((doc: any, index: number) => (
                      <li key={index} style={{ color: COLORS.accent }}>
                        {doc.title || "Untitled Document"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: COLORS.textSecondary }}>
                    No knowledge documents linked.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
