const argumentsAfterScript = process.argv.slice(2).filter((argument) => argument !== "--");
const originArgument = argumentsAfterScript[0] ?? process.env.PUBLIC_ORIGIN;
if (!originArgument) {
  throw new Error("Pass the production origin as the first argument or set PUBLIC_ORIGIN.");
}

const origin = new URL(originArgument);
if (origin.origin !== originArgument || origin.protocol !== "https:") {
  throw new Error("The smoke target must be an HTTPS origin with no path.");
}

async function request(path, expectedStatus, assertions = () => undefined) {
  const response = await fetch(new URL(path, origin), {
    headers: { Accept: path.startsWith("/api/") ? "application/json" : "text/html" },
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });
  if (response.status !== expectedStatus) {
    throw new Error(`${path} returned ${response.status}; expected ${expectedStatus}.`);
  }
  await assertions(response);
  process.stdout.write(`${path} ${response.status}\n`);
}

function requireHeader(response, name, expectedFragment) {
  const value = response.headers.get(name);
  if (!value?.includes(expectedFragment)) {
    throw new Error(`${response.url} is missing ${name}: ${expectedFragment}.`);
  }
}

await request("/api/v1/health", 200, async (response) => {
  requireHeader(response, "cache-control", "no-store");
  requireHeader(response, "strict-transport-security", "max-age=31536000");
  requireHeader(response, "x-content-type-options", "nosniff");
  const body = await response.json();
  if (body.status !== "ok") throw new Error("Health response is not ok.");
});

await request("/api/v1/readiness", 200, async (response) => {
  const body = await response.json();
  if (body.status !== "ready") throw new Error("Readiness response is not ready.");
});

await request("/api/v1/not-a-route", 404, async (response) => {
  requireHeader(response, "content-type", "application/json");
  const body = await response.json();
  if (body.error?.code !== "NOT_FOUND") throw new Error("Unknown API route did not use the JSON error envelope.");
});

await request("/", 200, async (response) => {
  requireHeader(response, "content-security-policy-report-only", "frame-ancestors 'none'");
  requireHeader(response, "permissions-policy", "camera=()");
  requireHeader(response, "referrer-policy", "strict-origin-when-cross-origin");
  requireHeader(response, "cache-control", "no-cache");
  const body = await response.text();
  if (!body.includes("<div id=\"root\"></div>")) throw new Error("Production origin did not serve the SPA shell.");
});

process.stdout.write(`Production smoke passed for ${origin.origin}.\n`);
