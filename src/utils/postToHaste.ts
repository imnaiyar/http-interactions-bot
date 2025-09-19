/**
 * Posts provided code to hastebin
 * @param code
 */
export const postToHaste = async (code: any): Promise<string> => {
  const response = await fetch("https://hst.sh/documents/", {
    method: "POST",
    body: typeof code === "object" ? JSON.stringify(code, null, 2) : code,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Status code ${response.status}, something went wrong.`);
  }

  const bin = await response.json() as { key: string };

  return `https://hst.sh/${bin.key}.javascript`;
};
