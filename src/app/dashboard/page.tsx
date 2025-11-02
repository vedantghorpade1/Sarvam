"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Import all the icons you need from lucide-react
import {
    LayoutDashboard, PhoneCall, Bot, MessageSquare, Target, GitBranch,
    Users, Database, BarChart, CreditCard, Plus
} from "lucide-react";

// The navigation items, now living directly on the dashboard page
const navItems = [
    // Core AI Voice System
    { icon: <PhoneCall className="h-6 w-6" />, label: "Calls", href: "/dashboard/calls", description: "Manage voice calls & history", section: "AI Voice System" },
    { icon: <Bot className="h-6 w-6" />, label: "AI Agents", href: "/dashboard/agents", description: "Create & configure voice AI", section: "AI Voice System" },
    { icon: <MessageSquare className="h-6 w-6" />, label: "Call History", href: "/dashboard/calls/history", description: "Review transcripts & logs", section: "AI Voice System" },
    // CRM & Lead Management
    // { icon: <Target className="h-6 w-6" />, label: "Leads", href: "/dashboard/leads", description: "Track and manage potential customers", section: "CRM & Lead Management" },
    // { icon: <GitBranch className="h-6 w-6" />, label: "Pipelines", href: "/dashboard/leads/customize", description: "Customize your sales stages", section: "CRM & Lead Management" },
    // { icon: <Users className="h-6 w-6" />, label: "Contacts", href: "/dashboard/contacts", description: "Browse your customer database", section: "CRM & Lead Management" },
    // Business & Management
    { icon: <Database className="h-6 w-6" />, label: "Knowledge Base", href: "/dashboard/knowledge", description: "Manage AI training data", section: "Business Management" },
    { icon: <BarChart className="h-6 w-6" />, label: "Analytics", href: "/dashboard/analytics", description: "View usage insights & reports", section: "Business Management" },
    { icon: <CreditCard className="h-6 w-6" />, label: "Billing", href: "/dashboard/billing", description: "Manage subscriptions & payments", section: "Business Management" },
];

export default function DashboardPage() {
    const { user } = useAuth();
    const router = useRouter();

    // Group items by section for organized display
    const sections = navItems.reduce((acc, item) => {
        const section = item.section || 'General';
        if (!acc[section]) {
            acc[section] = [];
        }
        acc[section].push(item);
        return acc;
    }, {} as Record<string, typeof navItems>);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#111111]">
            <DashboardHeader />
            <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto px-4 sm:px-6 py-8">
                    {/* Welcome Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-wrap justify-between items-center gap-4 mb-8"
                    >
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F3FFD4]">
                                Welcome back, {user?.name || 'User'}!
                            </h1>
                            <p className="text-[#A7A7A7] mt-1">Here's your command center. What would you like to do today?</p>
                        </div>
                        <Button
                            onClick={() => router.push('/dashboard/new-agent')}
                            className="gap-2 bg-[#A7B3AC] text-[#111111] hover:bg-[#A7B3AC]/90 font-bold"
                        >
                            <Plus className="h-4 w-4" /> Create New Agent
                        </Button>
                    </motion.div>

                    {/* Navigation Card Grid */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-10"
                    >
                        {Object.entries(sections).map(([sectionTitle, items]) => (
                            <section key={sectionTitle}>
                                <motion.h2 variants={itemVariants} className="text-xl font-semibold text-[#F3FFD4] mb-4">
                                    {sectionTitle}
                                </motion.h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {items.map((item) => (
                                        <motion.div key={item.href} variants={itemVariants}>
                                            <Link href={item.href} className="h-full">
                                                <Card className="h-full flex flex-col bg-[#1a1a1a] border-[#333333] hover:border-[#A7B3AC] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#A7B3AC]/10">
                                                    <CardHeader className="flex flex-row items-center gap-4">
                                                        <div className="h-12 w-12 rounded-lg bg-[#A7B3AC]/10 flex items-center justify-center flex-shrink-0">
                                                            <div className="text-[#A7B3AC]">{item.icon}</div>
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-lg text-[#F3FFD4]">{item.label}</CardTitle>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="flex-1">
                                                        <CardDescription className="text-[#A7A7A7]">{item.description}</CardDescription>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </motion.div>
                    
                    {/* Placeholder for future dashboard widgets */}
                    <Separator className="my-12 bg-[#333333]" />
                    <div className="text-center text-[#A7A7A7]">
                        <h3 className="text-lg font-semibold text-[#F3FFD4]">Analytics & Recent Activity</h3>
                        <p className="text-sm">Future dashboard widgets (charts, stats, etc.) will be displayed here.</p>
                    </div>

                </div>
            </main>
        </div>
    );
}