"use strict";

exports.handler = async () => {
  const { getStore } = await import("@netlify/blobs"); // jen otestujeme import
  return { statusCode: 200, body: "import ok" };
};
