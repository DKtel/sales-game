exports.handler = async () => {
  const mod = await import("@netlify/blobs");
  return { statusCode: 200, body: mod ? "import ok" : "import failed" };
};
