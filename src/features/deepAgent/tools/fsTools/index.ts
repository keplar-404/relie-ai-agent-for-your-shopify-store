import { tool } from "langchain";
import { z } from "zod";
import * as fsOps from "@/services/codeSandbox/fsOperations";

export const listFsTool = tool(
  async ({ path, depth }) => fsOps.listFs(path, depth),
  {
    name: "list_fs",
    description:
      "List files and directories in the sandbox app workspace. GUIDANCE: Default to depth=1 to inspect top-level files; only specify higher depth when searching deep subdirectories.",
    schema: z.object({
      path: z.string().optional().describe("Folder path relative to app root (e.g., '' or 'src'). Defaults to root."),
      depth: z.number().optional().describe("Search depth level (default: 1). Keep at 1 unless deeper tree inspection is explicitly needed."),
    }),
  },
);

export const getFileDetailsTool = tool(
  async ({ path }) => fsOps.getFileDetails(path),
  {
    name: "get_file_details",
    description:
      "Get file details and metadata (size, permissions, modifiedAt, isDir) for a file or directory in the sandbox.",
    schema: z.object({
      path: z.string().optional().describe("Path relative to app root."),
    }),
  },
);

export const createFolderTool = tool(
  async ({ path, mode }) => fsOps.createFolder(path, mode),
  {
    name: "create_folder",
    description:
      "Create a directory in the sandbox app workspace with permission mode. GUIDANCE: Use mode '755' for standard directory creation.",
    schema: z.object({
      path: z.string().optional().describe("Path relative to app root."),
      mode: z.string().optional().describe("Permission mode (default: '755')."),
    }),
  },
);

export const uploadFileTool = tool(
  async ({ content, path }) => fsOps.uploadFile(content, path),
  {
    name: "upload_file",
    description:
      "Upload or write a single file to the sandbox app workspace. GUIDANCE: Preferred tool for creating or replacing single source files.",
    schema: z.object({
      content: z.string().describe("Text content of the file to write."),
      path: z.string().optional().describe("Target file path relative to app root."),
    }),
  },
);

export const uploadFilesTool = tool(
  async ({ files }) => fsOps.uploadFiles(files),
  {
    name: "upload_files",
    description:
      "Upload or write multiple files simultaneously in the sandbox app workspace. GUIDANCE: Use when creating or updating multiple files in a single step.",
    schema: z.object({
      files: z.array(
        z.object({
          source: z.string().describe("Text content of the file."),
          destination: z.string().describe("Target path relative to app root."),
        }),
      ),
    }),
  },
);

export const downloadFileTool = tool(
  async ({ path }) => fsOps.downloadFile(path),
  {
    name: "download_file",
    description:
      "Read/download the full string content of a file from the sandbox app workspace. GUIDANCE: Use when reading source files to inspect logic.",
    schema: z.object({
      path: z.string().optional().describe("File path relative to app root."),
    }),
  },
);

export const downloadFilesTool = tool(
  async ({ files }) => fsOps.downloadFiles(files),
  {
    name: "download_files",
    description:
      "Read/download multiple files at once from the sandbox app workspace. GUIDANCE: Preferred when inspecting several related files simultaneously.",
    schema: z.object({
      files: z.array(
        z.object({
          source: z.string().describe("Source file path relative to app root."),
          destination: z.string().optional().describe("Optional local destination path."),
        }),
      ),
    }),
  },
);

export const deleteFileTool = tool(
  async ({ path, recursive }) => fsOps.deleteFile(path, recursive),
  {
    name: "delete_file",
    description:
      "Delete a file or directory inside the sandbox app workspace. GUIDANCE: Set recursive=true only when deleting non-empty folders.",
    schema: z.object({
      path: z.string().optional().describe("Path relative to app root."),
      recursive: z.boolean().optional().describe("Set true to delete non-empty directories recursively."),
    }),
  },
);

export const setFilePermissionsTool = tool(
  async ({ path, perms }) => fsOps.setFilePermissions(path, perms),
  {
    name: "set_file_permissions",
    description:
      "Set permission mode (e.g., '755' or '644'), owner, and group for a path in the sandbox app workspace.",
    schema: z.object({
      path: z.string().optional().describe("Path relative to app root."),
      perms: z
        .object({
          mode: z.string().optional().describe("Permission mode (e.g. '755')."),
          owner: z.string().optional().describe("File owner."),
          group: z.string().optional().describe("File group."),
        })
        .optional(),
    }),
  },
);

export const searchFilesTool = tool(
  async ({ pattern, path }) => fsOps.searchFiles(pattern, path),
  {
    name: "search_files",
    description:
      "Search for file paths matching a glob pattern (e.g. '*.ts', 'src/**/*.tsx') inside the sandbox app workspace.",
    schema: z.object({
      pattern: z.string().optional().describe("Glob pattern to match file names."),
      path: z.string().optional().describe("Base directory relative to app root."),
    }),
  },
);

export const findFilesTool = tool(
  async ({ pattern, path }) => fsOps.findFiles(pattern, path),
  {
    name: "find_files",
    description:
      "Find code or text matches inside file contents in the sandbox app workspace. GUIDANCE: Use to locate specific imports, functions, or variable usages across files.",
    schema: z.object({
      pattern: z.string().describe("Text or pattern to search for inside file contents."),
      path: z.string().optional().describe("Base directory relative to app root."),
    }),
  },
);

export const replaceInFilesTool = tool(
  async ({ files, pattern, newValue }) => fsOps.replaceInFiles(files, pattern, newValue),
  {
    name: "replace_in_files",
    description:
      "Perform exact text find-and-replace across multiple files inside the sandbox app workspace.",
    schema: z.object({
      files: z.array(z.string()).describe("List of target file paths relative to app root."),
      pattern: z.string().describe("Exact text pattern to replace."),
      newValue: z.string().describe("Replacement text."),
    }),
  },
);

export const moveFilesTool = tool(
  async ({ source, destination }) => fsOps.moveFiles(source, destination),
  {
    name: "move_files",
    description:
      "Move or rename files and directories inside the sandbox app workspace.",
    schema: z.object({
      source: z.string().describe("Source path relative to app root."),
      destination: z.string().describe("Destination path relative to app root."),
    }),
  },
);
