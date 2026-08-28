import { sandBox } from "@/services/cloudSandbox";
import { Image } from "@daytona/sdk";

export default async function createCodeSandBox(): Promise<{
  previewUrl: string;
  sandboxId: string;
}> {
  const snapshotName = "react-vite-bun-v2";

  // 1. Create base image definition with git, clone, and package installs
  const image = Image.base("oven/bun:1-debian")
    .runCommands(
      "apt-get update && apt-get install -y curl git",
      "git clone https://github.com/keplar-404/template-react-project.git /home/daytona/app",
      "cd /home/daytona/app && bun install"
    );

  let sandbox;
  try {
    // 2. Try instantiating sandbox directly from the snapshot
    sandbox = await sandBox.create({
      snapshot: snapshotName,
      ephemeral: true,
      autoStopInterval: 5,
    });
  } catch (err) {
    // 3. Fallback: Create the snapshot template with auto-start entrypoint and retry
    try {
      await sandBox.snapshot.create({
        name: snapshotName,
        image: image,
        entrypoint: [
          "bun",
          "run",
          "--cwd",
          "/home/daytona/app",
          "dev",
          "--",
          "--host",
          "0.0.0.0",
          "--port",
          "3000",
        ],
      });
    } catch (snapshotErr: any) {
      // Ignore if snapshot already exists (status 409), rethrow others
      if (snapshotErr.statusCode !== 409) {
        throw snapshotErr;
      }
    }

    sandbox = await sandBox.create({
      snapshot: snapshotName,
      ephemeral: true,
      autoStopInterval: 5,
    });
  }

  // 4. Retrieve preview URL (server starts automatically via entrypoint)
  const preview = await sandbox.getSignedPreviewUrl(3000, 3600);

  return {
    previewUrl: preview.url,
    sandboxId: sandbox.id,
  };
}
