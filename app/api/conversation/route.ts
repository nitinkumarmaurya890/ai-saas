import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = auth();

    // if (!userId) {
    //   return new NextResponse("Unauthorized", { status: 401 });
    // }

    const body = await req.json();
    const { messages } = body;

    if (!messages) {
      return new NextResponse("Messages are required", { status: 400 });
    }

    const userPrompt = messages[messages.length - 1]?.content;

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${process.env.HUGGINGFACE_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: userPrompt,
        }),
      }
    );

    const result = await response.json();

    console.log("Hugging Face API Response:", result);

    if (!response.ok) {
      console.error("Hugging Face Error:", result);
      return new NextResponse("Error fetching response from Hugging Face", {
        status: 500,
      });
    }

    const botMessage = {
      role: "assistant",
      content: result[0]?.generated_text || "Error generating text",
    };

    return NextResponse.json(botMessage);
  } catch (error) {
    console.error("[CONVERSATION_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
