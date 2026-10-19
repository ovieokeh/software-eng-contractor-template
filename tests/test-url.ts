export const testPort = Number(process.env.TEST_PORT || 3000);
if (!Number.isInteger(testPort) || testPort < 1 || testPort > 65535)
  throw new Error("Invalid TEST_PORT");
export const baseURL = `http://localhost:${testPort}`;
