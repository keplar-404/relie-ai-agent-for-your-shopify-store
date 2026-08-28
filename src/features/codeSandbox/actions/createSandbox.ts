"use server";

import { Image } from "@daytona/sdk";
import { sandBox } from "@/services/cloudSandbox";

export default async function createCodeSandBox(): Promise<{
  previewUrl: string;
  sandboxId: string;
}> {
  const sandbox = await sandBox.create({
    image: Image.base("oven/bun:1-debian"),
    envVars: { NODE_ENV: "development" },
    resources: {
      cpu: 2,
      memory: 4, // 4 GB RAM
      disk: 5,
    },
  });

  await sandbox.process.executeCommand(
    "apt-get update && apt-get install -y git curl",
    undefined,
    undefined,
    60,
  );

  await sandbox.process.executeCommand(
    "git clone https://github.com/keplar-404/template-react-project.git /home/daytona/app",
    undefined,
    undefined,
    60,
  );

  await sandbox.process.executeCommand("bun install", "/home/daytona/app", undefined, 60);

  await sandbox.process.executeCommand(
    "nohup bun run dev -- --host 0.0.0.0 --port 3000 > /home/daytona/dev.log 2>&1 < /dev/null &",
    "/home/daytona/app",
  );

  await sandbox.process.executeCommand("sleep 4");

  const preview = await sandbox.getSignedPreviewUrl(3000, 3600);

  return {
    previewUrl: preview.url,
    sandboxId: sandbox.id,
  };
}
