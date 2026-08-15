import { sandBox } from "@/services/cloudSandbox";

export default async function createCodeSandBox() {
  // Create the Sandbox instance
  const sandbox = await sandBox.create({
    language: "typescript",
  });

  // Run the code securely inside the Sandbox
  const response = await sandbox.process.codeRun(
    'console.log("Hello World from code!")',
  );
  console.log(response.result);
}

