import { NextResponse } from "next/server";

const allVoices = [
    { id: "anushka", name: "Anushka", tags: "Female, Clear, Professional (Default)", demo: "" },
    { id: "manisha", name: "Manisha", tags: "Female, Warm, Friendly", demo: "" },
    { id: "vidya", name: "Vidya", tags: "Female, Articulate, Precise", demo: "" },
    { id: "arya", name: "Arya", tags: "Female, Young, Energetic", demo: "" },
    { id: "abhilash", name: "Abhilash", tags: "Male, Deep, Authoritative", demo: "" },
    { id: "karun", name: "Karun", tags: "Male, Natural, Conversational", demo: "" },
    { id: "hitesh", name: "Hitesh", tags: "Male, Professional, Engaging", demo: "" },
];

export const dynamic = "force-dynamic";

export async function GET() {
  // We just return the hard-coded list
  return NextResponse.json({ voices: allVoices });
}