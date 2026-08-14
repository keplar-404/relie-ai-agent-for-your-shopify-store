import { tool } from "langchain";
import * as z from "zod";

export const getWeather = tool(async ({ location }) => `Sunny in ${location}`, {
  name: "get_weather",
  description: "Get the current weather in a given location",
  schema: z.object({
    location: z.string().describe("The city and state, e.g. San Francisco, CA"),
  }),
});
