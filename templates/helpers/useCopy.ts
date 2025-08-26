import { useState } from "react";

export const useCopy = () => {
  const [copiedKeyId, setCopiedKeyId] = useState(false);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKeyId(true);
    setTimeout(() => setCopiedKeyId(false), 1500);
  };

  return { copiedKeyId, copyToClipboard };
};
