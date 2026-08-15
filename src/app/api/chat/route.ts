import { generateTextMessage } from "@/features/ai/actions/generateTextMessage";

export async function POST(req: Request) {
  const { message } = await req.json();
  const aiResponse = await generateTextMessage(message);
  return Response.json({ message: aiResponse });
}
