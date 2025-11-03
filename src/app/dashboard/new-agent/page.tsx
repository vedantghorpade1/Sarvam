"use client";

import { useState } from "react";
import useSWR from "swr"; 
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { motion } from "framer-motion";

// --- **ADDED Combobox/Command imports** ---
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // <-- ADDED
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"; // <-- ADDED
import { cn } from "@/lib/utils";
import { VariableTextarea } from "@/components/ui/variable-textarea";

// --- **ADDED Combobox/Command icons** ---
import {
    Search, ArrowLeft, Bot, UserRoundCheck, HelpCircle, Clock, Lightbulb, Sparkles, Mic,
    Settings, Volume2, Wand2, User, Globe, CalendarCheck, Calendar, CheckCircle, Upload, FileText,
    Link as LinkIcon, BookOpen, Trash2, Plus, Calculator, Search as SearchIcon, Mail, Wrench, Cpu,
    ChevronsUpDown // <-- ADDED
} from "lucide-react";
import { Label } from "@radix-ui/react-label";

// --- UPDATED SCHEMA FOR CARTESIA ---
const agentSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    description: z.string().optional(),
    voiceId: z.string().min(1, "Please select a voice"), // <-- Cartesia 'Sonic' TTS Model ID
    firstMessage: z.string().min(3, "First message is required"),
    systemPrompt: z.string().min(10, "System prompt must be at least 10 characters"),
    templateId: z.string().optional(),
    sttModel: z.string().min(1, "STT Model is required"), 
    llmModel: z.string().min(1, "LLM Model is required"), 
    temperature: z.number().min(0).max(2).optional(),
    language: z.string().optional(),
    maxDurationSeconds: z.number().min(60).max(7200).optional(),
    knowledgeDocuments: z.array(z.object({
        type: z.enum(['url', 'text']),
        name: z.string(),
        content: z.string().optional(),
        url: z.string().optional(),
    })).optional(),
    tools: z.array(z.string()).optional(),
});
// --- END SCHEMA UPDATE ---

const agentTemplates = [
    // ... (Your agent templates remain the same)
    { id: "sales-assistant", title: "Sales Assistant", icon: UserRoundCheck, description: "A friendly agent that helps qualify leads and schedule sales meetings", category: "Sales & Lead Generation", prompt: "You are a professional and friendly sales assistant. Your task is to engage with potential customers, understand their needs, answer product questions, and help schedule meetings with our sales team if they're interested. Be conversational but efficient. Avoid making promises about pricing or features you're unsure about - instead, acknowledge the question and offer to connect them with a sales representative who can provide accurate information. Always maintain a helpful, understanding tone.", firstMessage: "Hi there! I'm your sales assistant from [Company]. I'd be happy to tell you about our products and services. What brings you here today?" },
    { id: "customer-support", title: "Customer Support", icon: HelpCircle, description: "An empathetic agent that handles customer inquiries and resolves issues", category: "Customer Service", prompt: "You are a patient and empathetic customer support agent. Your goal is to help users resolve their issues efficiently while showing genuine concern for their problems. Listen carefully to their issues, ask clarifying questions, and provide clear step-by-step solutions when possible. If you don't know the answer, don't make one up - instead, acknowledge the complexity of their issue and offer to escalate it to a specialist. Use a reassuring and professional tone throughout the conversation.", firstMessage: "Hello! I'm your customer support assistant. I'm here to help resolve any issues you're experiencing. Could you please describe what's happening?" },
    { id: "appointment-scheduler", title: "Appointment Scheduler", icon: Clock, description: "An efficient agent that helps book and manage appointments", category: "Scheduling & Booking", prompt: "You are an efficient appointment scheduling assistant. Your primary role is to help callers book, reschedule, or cancel appointments. Maintain a professional and friendly demeanor while being direct and efficient with the caller's time. Ask for essential information needed for appointments, such as name, preferred date and time, contact information, and reason for the appointment. Confirm details before finalizing, and clearly communicate next steps. If the requested time is not available, offer alternatives.", firstMessage: "Hello! I'm the appointment scheduling assistant. I'd be happy to help you book, reschedule, or cancel an appointment. How can I assist you today?" },
];
const availableTools = [
    { id: "web_search", name: "Web Search", description: "Search the internet for current information", icon: SearchIcon },
    { id: "calculator", name: "Calculator", description: "Perform mathematical calculations", icon: Calculator },
    { id: "calendar", name: "Calendar", description: "Access calendar and scheduling functions", icon: Calendar },
    { id: "email", name: "Email", description: "Send and manage email communications", icon: Mail }
];

const languages = [
    { id: "en", name: "English" }, { id: "es", name: "Spanish" }, { id: "fr", name: "French" },
    { id: "de", name: "German" }, { id: "it", name: "Italian" }, { id: "pt", name: "Portuguese" },
    { id: "hi", name: "Hindi" }, { id: "ja", name: "Japanese" }, { id: "ko", name: "Korean" }, { id: "zh", name: "Chinese" }
];

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function NewAgent() {
    
    const { data: voicesData, error: voicesError, isLoading: voicesLoading } = useSWR<{ voices: { id: string, name: string, tags: string, demo: string }[] }>("/api/voices", fetcher);
    const allVoices = voicesData?.voices || [];

    const [creatingAgent, setCreatingAgent] = useState(false);
    const [newDocumentType, setNewDocumentType] = useState<'url' | 'text'>('text'); 

    const form = useForm<z.infer<typeof agentSchema>>({
        resolver: zodResolver(agentSchema),
        defaultValues: {
            name: "",
            description: "",
            voiceId: "", // Start with no voice selected
            firstMessage: "Hello! I'm here to assist you today. How can I help you?",
            systemPrompt: "You are a friendly and professional AI assistant. Your goal is to provide helpful, accurate information and assist users with their queries in a conversational manner.",
            templateId: "",
            sttModel: "ink-whisper", 
            llmModel: "gpt-4o",      
            temperature: 0.3,
            language: "en",
            maxDurationSeconds: 1800,
            knowledgeDocuments: [],
            tools: [],
        }
    });

    const selectedTemplate = form.watch("templateId");
    const knowledgeDocuments = form.watch("knowledgeDocuments") || [];
    const maxDuration = form.watch("maxDurationSeconds") || 1800;

    // Set default voice once loaded
    useState(() => {
        if (!voicesLoading && allVoices.length > 0 && !form.getValues("voiceId")) {
            form.setValue("voiceId", allVoices[0].id);
        }
    }, [voicesLoading, allVoices, form]);

    const applyTemplate = (templateId: string) => {
        const template = agentTemplates.find(t => t.id === templateId);
        if (template) {
            form.setValue("systemPrompt", template.prompt);
            form.setValue("firstMessage", template.firstMessage);
            form.setValue("templateId", templateId);
            if (!form.getValues("name").trim()) {
                form.setValue("name", template.title);
            }
        }
    };

    const addKnowledgeDocument = () => {
        const currentDocs = form.getValues("knowledgeDocuments") || [];
        form.setValue("knowledgeDocuments", [...currentDocs, {
            type: newDocumentType,
            name: newDocumentType === 'url' ? 'New Website URL' : 'New Text Document',
            content: newDocumentType === 'text' ? '' : undefined,
            url: newDocumentType === 'url' ? '' : undefined,
        }]);
    };
    
    const updateKnowledgeDocument = (index: number, field: string, value: string) => {
        const currentDocs = form.getValues("knowledgeDocuments") || [];
        const updatedDocs = currentDocs.map((doc, i) => (i === index ? { ...doc, [field]: value } : doc));
        form.setValue("knowledgeDocuments", updatedDocs);
    };

    const removeKnowledgeDocument = (index: number) => {
        const currentDocs = form.getValues("knowledgeDocuments") || [];
        form.setValue("knowledgeDocuments", currentDocs.filter((_, i) => i !== index));
    };

    const onSubmit = async (payload: z.infer<typeof agentSchema>) => {
      try {
        setCreatingAgent(true);

        const agentData = {
          name: payload.name,
          description: payload.description,
          systemPrompt: payload.systemPrompt,
          firstMessage: payload.firstMessage,
          language: payload.language,
          maxDurationSeconds: payload.maxDurationSeconds,
          knowledgeDocuments: payload.knowledgeDocuments,
          tools: payload.tools,
          templateId: payload.templateId,
          models: {
            tts: {
              provider: "cartesia",
              model_id: payload.voiceId 
            },
            stt: {
              provider: "cartesia",
              model_id: payload.sttModel 
            },
            llm: {
              provider: "openai", 
              model_id: payload.llmModel, 
              temperature: payload.temperature
            }
          }
        };
    
        const response = await fetch("/api/createAgent", {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(agentData), 
        });
    
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Server validation error:", errorData.errors || errorData.message);
          throw new Error(errorData.message || "Failed to create agent");
        }
    
        console.log("Agent created! Redirecting...");
      } catch (error: any) {
        console.error("Error creating agent:", error.message);
      } finally {
        setCreatingAgent(false);
      }
    };

    const templatesByCategory = agentTemplates.reduce((acc, template) => {
        if (!acc[template.category]) acc[template.category] = [];
        acc[template.category].push(template);
        return acc;
    }, {} as { [key: string]: typeof agentTemplates });

    const containerVariant = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    const fadeInUpVariant = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    };

    return (
        <div className="min-h-screen text-foreground flex">
            <main className="flex-1 h-screen overflow-y-auto bg-[#111111]">
                {/* <DashboardHeader /> */}
                <div className="container mx-auto px-4 sm:px-6 py-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                            <div>
                                <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-[#A7A7A7] hover:text-[#F3FFD4]" >
                                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Agents
                                </Button>
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F3FFD4]">Create AI Voice Agent</h1>
                                <p className="text-[#A7A7A7] mt-2 text-lg">Design your conversational AI assistant with advanced capabilities.</p>
                            </div>
                        </div>

                        <motion.div initial="hidden" animate="visible" variants={containerVariant}>
                            <motion.div variants={fadeInUpVariant} className="mb-12">
                                <div className="flex items-center gap-2 mb-6">
                                    <Wand2 className="h-5 w-5 text-[#A7B3AC]" />
                                    <h2 className="text-xl font-semibold text-[#F3FFD4]">Choose a Template</h2>
                                    <Badge variant="secondary" className="text-xs bg-[#A7B3AC]/20 text-[#A7B3AC] border-[#A7B3AC]/30">Recommended</Badge>
                                </div>
                                <div className="space-y-6">
                                    {Object.entries(templatesByCategory).map(([category, templates]) => (
                                        <div key={category}>
                                            <h3 className="text-sm font-medium text-[#A7A7A7] mb-3 uppercase tracking-wide">{category}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {templates.map((template) => (
                                                    <Card key={template.id} onClick={() => applyTemplate(template.id)} className={cn(
                                                        "cursor-pointer transition-all bg-[#1a1a1a] border-[#333333] hover:border-[#A7B3AC]/50",
                                                        selectedTemplate === template.id && "ring-2 ring-[#A7B3AC] border-[#A7B3AC]"
                                                    )}>
                                                        <CardHeader className="pb-3">
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-12 w-12 rounded-lg bg-[#A7B3AC]/10 flex items-center justify-center"><template.icon className="h-6 w-6 text-[#A7B3AC]" /></div>
                                                                    <CardTitle className="text-lg text-[#F3FFD4]">{template.title}</CardTitle>
                                                                </div>
                                                                {selectedTemplate === template.id && <CheckCircle className="h-5 w-5 text-[#A7B3AC]" />}
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent><p className="text-sm text-[#A7A7A7] line-clamp-2">{template.description}</p></CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
                                    <motion.div variants={fadeInUpVariant}>
                                        <Tabs defaultValue="basic" className="w-full">
                                            <TabsList className="grid w-full grid-cols-4 bg-[#1a1a1a] border border-[#333333] p-1 h-auto">
                                                <TabsTrigger value="basic">Basic</TabsTrigger>
                                                <TabsTrigger value="behavior">Behavior</TabsTrigger>
                                                <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
                                                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                                            </TabsList>
                                            <div className="mt-6">
                                                <TabsContent value="basic" className="m-0">
                                                    <Card className="border-[#333333] bg-[#1a1a1a] shadow-md">
                                                        <CardHeader><CardTitle className="text-[#F3FFD4]">Agent Identity</CardTitle><CardDescription className="text-[#A7A7A7]">Define your AI assistant's name and purpose.</CardDescription></CardHeader>
                                                        <CardContent className="space-y-6">
                                                            <FormField control={form.control} name="name" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[#A7A7A7]">Agent Name</FormLabel>
                                                                    <FormControl><Input placeholder="e.g., Sales Assistant" {...field} /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                            
                                                            {/* --- **THIS IS THE NEW SEARCHABLE COMBOBOX** --- */}
                                                            <FormField control={form.control} name="voiceId" render={({ field }) => (
                                                                <FormItem className="flex flex-col">
                                                                    <FormLabel className="text-[#A7A7A7]">Cartesia Voice (TTS)</FormLabel>
                                                                    <Popover>
                                                                        <PopoverTrigger asChild>
                                                                            <FormControl>
                                                                                <Button
                                                                                    variant="outline"
                                                                                    role="combobox"
                                                                                    className={cn(
                                                                                        "w-full justify-between",
                                                                                        !field.value && "text-muted-foreground"
                                                                                    )}
                                                                                >
                                                                                    {field.value
                                                                                        ? allVoices.find((voice) => voice.id === field.value)?.name
                                                                                        : "Select a voice..."}
                                                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                                </Button>
                                                                            </FormControl>
                                                                        </PopoverTrigger>
                                                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                                            <Command>
                                                                                <CommandInput placeholder="Search voice name..." />
                                                                                <CommandEmpty>
                                                                                    {voicesLoading ? "Loading voices..." : "No voice found."}
                                                                                </CommandEmpty>
                                                                                <CommandGroup>
                                                                                    {allVoices.map((voice) => (
                                                                                        <CommandItem
                                                                                            value={voice.name} // This allows searching by name
                                                                                            key={voice.id}
                                                                                            onSelect={() => {
                                                                                                form.setValue("voiceId", voice.id); // This sets the ID
                                                                                            }}
                                                                                        >
                                                                                            <CheckCircle
                                                                                                className={cn(
                                                                                                    "mr-2 h-4 w-4",
                                                                                                    voice.id === field.value ? "opacity-100 text-[#A7B3AC]" : "opacity-0"
                                                                                                )}
                                                                                            />
                                                                                            <div className="flex flex-col">
                                                                                                <span className="font-medium">{voice.name}</span>
                                                                                                <span className="text-xs text-muted-foreground">{voice.tags}</span>
                                                                                            </div>
                                                                                        </CommandItem>
                                                                                    ))}
                                                                                </CommandGroup>
                                                                            </Command>
                                                                        </PopoverContent>
                                                                    </Popover>
                                                                    <FormDescription className="text-xs text-[#A7A7A7]/80">
                                                                        Select the Cartesia Sonic voice for your agent.
                                                                    </FormDescription>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                            {/* --- **END OF NEW COMPONENT** --- */}

                                                        </CardContent>
                                                    </Card>
                                                </TabsContent>
                                                <TabsContent value="behavior" className="m-0">
                                                    <Card className="border-[#333333] bg-[#1a1a1a] shadow-md">
                                                        <CardHeader><CardTitle className="text-[#F3FFD4]">Agent Behavior</CardTitle><CardDescription className="text-[#A7A7A7]">Define how your agent communicates and responds.</CardDescription></CardHeader>
                                                        <CardContent className="space-y-6"> 
                                                            <FormField control={form.control} name="systemPrompt" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[#A7A7A7]">System Prompt</FormLabel>
                                                                    <FormControl><Textarea rows={8} placeholder="You are a friendly AI assistant..." {...field} /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} /> 
                                                            <FormField control={form.control} name="firstMessage" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[#A7A7A7]">First Message</FormLabel>
                                                                    <FormControl><Textarea rows={3} placeholder="Hello! How can I help you today?" {...field} /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                        </CardContent>
                                                    </Card>
                                                </TabsContent>
                                                <TabsContent value="knowledge" className="m-0">
                                                    <Card className="border-[#333333] bg-[#1a1a1a] shadow-md">
                                                        <CardHeader><CardTitle className="text-[#F3FFD4]">Knowledge & Tools</CardTitle><CardDescription className="text-[#A7A7A7]">Enhance your agent's capabilities.</CardDescription></CardHeader>
                                                        <CardContent className="space-y-6">
                                                            <div>
                                                                <Label className="text-[#A7A7A7] font-semibold">Knowledge Base</Label>
                                                                <p className="text-sm text-[#A7A7A7]/80 mb-4">Provide information via text or URLs.</p>
                                                                <div className="flex items-center gap-2 mb-4">
                                                                    <Select value={newDocumentType} onValueChange={(value: 'url' | 'text') => setNewDocumentType(value)}>
                                                                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="text"><div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Text</div></SelectItem>
                                                                            <SelectItem value="url"><div className="flex items-center gap-2"><LinkIcon className="h-4 w-4" /> URL</div></SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <Button type="button" variant="outline" onClick={addKnowledgeDocument} className="border-[#333333] hover:bg-white/5 text-[#A7A7A7]"><Plus className="h-4 w-4 mr-2" /> Add</Button>
                                                                </div>
                                                                <div className="space-y-3">{knowledgeDocuments.map((doc, index) => (
                                                                    <div key={index} className="border border-[#333333] rounded-lg p-3 space-y-2 bg-[#111111]/50">
                                                                        <div className="flex justify-between items-center"><p className="font-medium text-sm text-[#F3FFD4]">{doc.name}</p><Button type="button" variant="ghost" size="icon" onClick={() => removeKnowledgeDocument(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div>
                                                                        {doc.type === 'url' && <Input value={doc.url || ''} onChange={(e) => updateKnowledgeDocument(index, 'url', e.target.value)} placeholder="https://example.com" />}
                                                                        {doc.type === 'text' && <Textarea value={doc.content || ''} onChange={(e) => updateKnowledgeDocument(index, 'content', e.target.value)} placeholder="Paste text here..." />}
                                                                    </div>
                                                                ))}</div>
                                                            </div>
                                                            <Separator className="bg-[#333333]" />
                                                            <div>
                                                                <Label className="text-[#A7A7A7] font-semibold">Tools</Label>
                                                                <p className="text-sm text-[#A7A7A7]/80 mb-4">Enable tools for your agent to perform actions.</p>
                                                                <FormField control={form.control} name="tools" render={({ field }) => (
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                        {availableTools.map((tool) => (
                                                                            <div key={tool.id} onClick={() => { const current = field.value || []; const updated = current.includes(tool.id) ? current.filter(t => t !== tool.id) : [...current, tool.id]; field.onChange(updated); }} className={cn("border rounded-lg p-3 cursor-pointer flex items-center gap-3 border-[#333333] hover:bg-white/5", field.value?.includes(tool.id) && "ring-2 ring-[#A7B3AC] border-[#A7B3AC]")}>
                                                                                <tool.icon className="h-5 w-5 text-[#A7B3AC]" />
                                                                                <div><p className="font-medium text-sm text-[#F3FFD4]">{tool.name}</p><p className="text-xs text-[#A7A7A7]">{tool.description}</p></div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )} />
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </TabsContent>
                                                <TabsContent value="advanced" className="m-0">
                                                    <Card className="border-[#333333] bg-[#1a1a1a] shadow-md">
                                                        <CardHeader><CardTitle className="text-[#F3FFD4]">Advanced Settings</CardTitle><CardDescription className="text-[#A7A7A7]">Fine-tune the technical parameters of your agent.</CardDescription></CardHeader>
                                                        <CardContent className="space-y-6">
                                                            
                                                            <FormField control={form.control} name="llmModel" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[#A7A7A7]">LLM Model</FormLabel>
                                                                    <FormControl><Input placeholder="e.g., gpt-4o" {...field} /></FormControl>
                                                                    <FormDescription className="text-xs text-[#A7A7A7]/80">The reasoning model (e.g., gpt-4o, claude-3-haiku).</FormDescription>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                            <FormField control={form.control} name="sttModel" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[#A7A7A7]">Speech-to-Text Model</FormLabel>
                                                                    <FormControl><Input placeholder="e.g., ink-whisper" {...field} /></FormControl>
                                                                    <FormDescription className="text-xs text-[#A7A7A7]/80">Cartesia 'Ink' STT model name.</FormDescription>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                            
                                                            <FormField control={form.control} name="temperature" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[#A7A7A7]">LLM Temperature: {field.value}</FormLabel>
                                                                    <FormControl><Slider min={0} max={2} step={0.1} value={[field.value || 0.3]} onValueChange={(v) => field.onChange(v[0])} /></FormControl>
                                                                    <FormDescription className="text-xs text-[#A7A7A7]/80">Controls the creativity of the LLM. 0 is deterministic, 2 is very creative.</FormDescription>
                                                                </FormItem>
                                                            )} />
                                                            <FormField control={form.control} name="language" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[#A7A7A7]">Primary Language</FormLabel>
                                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                                        <SelectContent>{languages.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                                                                    </Select>
                                                                </FormItem>
                                                            )} />
                                                            <FormField control={form.control} name="maxDurationSeconds" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[#A7A7A7]">Max Call Duration: {Math.floor((field.value || 1800) / 60)} minutes</FormLabel>
                                                                    <FormControl><Slider min={60} max={7200} step={60} value={[field.value || 1800]} onValueChange={(v) => field.onChange(v[0])} /></FormControl>
                                                                </FormItem>
                                                            )} />
                                                        </CardContent>
                                                    </Card>
                                                </TabsContent>
                                            </div>
                                        </Tabs>
                                    </motion.div>
                                    
                                    <motion.div variants={fadeInUpVariant} className="flex justify-end space-x-4">
                                        <Button type="button" variant="outline" className="border-[#333333] hover:bg-white/5 text-[#A7A7A7] hover:text-[#F3FFD4]">Cancel</Button>
                                        <Button type="submit" disabled={creatingAgent} className="gap-2 min-w-[160px] bg-[#A7B3AC] text-[#111111] hover:bg-[#A7B3AC]/90 font-bold">
                                            {creatingAgent ? (<><motion.div animate={{ rotate: 360 }} 
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }} 
                                            className="h-4 w-4 border-2 border-[#111111]/20 border-t-[#111111] rounded-full" />
                                                Creating Agent...</>) : (<><Sparkles className="h-4 w-4" />Create Voice Agent</>)}
                                        </Button>
                                    </motion.div>
                                </form>
                            </Form>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    ); 
}