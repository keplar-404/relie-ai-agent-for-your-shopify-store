import model from "./";

export async function generateTextStream(
  prompt: Parameters<typeof model.stream>[0],
) {
  const stream = await model.stream(prompt);
  return stream;
}
