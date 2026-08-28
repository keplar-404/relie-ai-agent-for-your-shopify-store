'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import createCodeSandBox from "../actions/createSandbox";

function CreateSandbox() {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateSandbox() {
    setLoading(true);
    setPreviewUrl(null);
    setError(null);

    try {
      const { previewUrl } = await createCodeSandBox();
      setPreviewUrl(previewUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create sandbox");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={handleCreateSandbox} disabled={loading} className="w-fit">
        {loading ? "Creating sandbox…" : "Create Sandbox"}
      </Button>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {previewUrl && (
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline text-sm break-all"
        >
          {previewUrl}
        </a>
      )}
    </div>
  );
}

export default CreateSandbox;