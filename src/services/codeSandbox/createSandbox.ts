import { Image } from "@daytona/sdk";
import sandBox from "./index";
import { setActiveSandbox } from "./sandboxStore";

const SNAPSHOT_NAME = "react-vite-bun-v2";

export default async function createCodeSandBox(): Promise<{
  previewUrl: string;
  sandboxId: string;
}> {
  let sandbox;
  try {
    sandbox = await sandBox.create({
      snapshot: SNAPSHOT_NAME,
      ephemeral: true,
      autoStopInterval: 5,
    });
  } catch {
    const image = Image.base("oven/bun:1-debian").runCommands(
      "apt-get update && apt-get install -y curl git",
      "git clone https://github.com/keplar-404/template-react-project.git /home/daytona/app",
      "cd /home/daytona/app && bun install",
    );

    try {
      await sandBox.snapshot.create({
        name: SNAPSHOT_NAME,
        image,
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
      if (snapshotErr?.statusCode !== 409) throw snapshotErr;
    }

    sandbox = await sandBox.create({
      snapshot: SNAPSHOT_NAME,
      ephemeral: true,
      autoStopInterval: 5,
    });
  }

  // Cache active sandbox instance in memory immediately
  setActiveSandbox(sandbox);

  const preview = await sandbox.getSignedPreviewUrl(3000, 3600);

  return {
    previewUrl: preview.url,
    sandboxId: sandbox.id,
  };
}
