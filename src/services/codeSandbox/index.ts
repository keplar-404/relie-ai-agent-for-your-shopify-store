import { Daytona, Image } from "@daytona/sdk";
import { env } from "@/lib/env";

if (!env.DAYTONA_API_KEY) throw new Error("DAYTONA_API_KEY is not set");
const sandBox = new Daytona({ apiKey: env.DAYTONA_API_KEY });


export default sandBox;
export * from "./ptyOperations";
export * from "./processOperations";
export * from "./fsOperations";
export { default as createCodeSandBox } from "./createSandbox";