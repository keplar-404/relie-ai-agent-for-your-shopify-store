export async function provisionSandbox(): Promise<{
  previewUrl: string;
  sandboxId: string;
}> {
  const response = await fetch("/api/sandbox", {
    method: "POST",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to provision sandbox");
  }

  return response.json();
}
