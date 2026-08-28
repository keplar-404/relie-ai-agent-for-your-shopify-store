import { Daytona } from "@daytona/sdk";
import { env } from "@/lib/env";

// Initialize the Daytona client
export const sandBox = new Daytona({ apiKey: env.DAYTONA_API_KEY });
