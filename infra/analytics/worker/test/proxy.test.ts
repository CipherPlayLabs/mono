import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index";

const env = {
  PLAUSIBLE_ORIGIN_HOSTNAME: "analytics.lobst3rs.com",
  CF_ACCESS_CLIENT_ID: "worker-client-id",
  CF_ACCESS_CLIENT_SECRET: "worker-client-secret",
};

function makeRequest(path: string, init?: RequestInit) {
  return new Request(`https://cipherplay.local${path}`, init);
}

describe("analytics proxy worker", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("upstream ok", {
        status: 200,
        headers: {
          "content-type": "text/plain",
        },
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("proxies same-origin script requests to the Plausible script path", async () => {
    const response = await worker.fetch(makeRequest("/_analytics/js/script.js"), env);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("upstream ok");

    const upstreamRequest = vi.mocked(fetch).mock.calls[0]?.[0];
    expect(upstreamRequest).toBeInstanceOf(Request);
    expect((upstreamRequest as Request).url).toBe("https://analytics.lobst3rs.com/js/script.js");
  });

  it("proxies event posts to the Plausible event endpoint with the original body", async () => {
    const response = await worker.fetch(
      makeRequest("/_analytics/api/event", {
        method: "POST",
        body: JSON.stringify({ name: "pageview", url: "https://cipherplay.local/" }),
        headers: {
          "content-type": "application/json",
        },
      }),
      env,
    );

    expect(response.status).toBe(200);

    const upstreamRequest = vi.mocked(fetch).mock.calls[0]?.[0] as Request;
    expect(upstreamRequest.url).toBe("https://analytics.lobst3rs.com/api/event");
    expect(upstreamRequest.method).toBe("POST");
    expect(await upstreamRequest.text()).toBe(
      JSON.stringify({ name: "pageview", url: "https://cipherplay.local/" }),
    );
  });

  it("preserves visitor-identifying headers Plausible needs", async () => {
    await worker.fetch(
      makeRequest("/_analytics/api/event", {
        method: "POST",
        body: "{}",
        headers: {
          "user-agent": "Test Browser",
          "x-forwarded-for": "203.0.113.9",
          "accept-language": "en-US,en;q=0.9",
          "referer": "https://cipherplay.local/market-analysis",
        },
      }),
      env,
    );

    const upstreamRequest = vi.mocked(fetch).mock.calls[0]?.[0] as Request;
    expect(upstreamRequest.headers.get("user-agent")).toBe("Test Browser");
    expect(upstreamRequest.headers.get("x-forwarded-for")).toBe("203.0.113.9");
    expect(upstreamRequest.headers.get("accept-language")).toBe("en-US,en;q=0.9");
    expect(upstreamRequest.headers.get("referer")).toBe("https://cipherplay.local/market-analysis");
  });

  it("authenticates to the Access-protected Plausible origin with a service token", async () => {
    await worker.fetch(makeRequest("/_analytics/js/script.js"), env);

    const upstreamRequest = vi.mocked(fetch).mock.calls[0]?.[0] as Request;
    expect(upstreamRequest.headers.get("CF-Access-Client-Id")).toBe("worker-client-id");
    expect(upstreamRequest.headers.get("CF-Access-Client-Secret")).toBe("worker-client-secret");
  });

  it("returns unsupported route errors without calling the Plausible origin", async () => {
    const missingPath = await worker.fetch(makeRequest("/_analytics/nope"), env);
    const wrongMethod = await worker.fetch(makeRequest("/_analytics/js/script.js", { method: "POST" }), env);

    expect(missingPath.status).toBe(404);
    expect(await missingPath.text()).toBe("Not found");
    expect(wrongMethod.status).toBe(405);
    expect(await wrongMethod.text()).toBe("Method not allowed");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not expose the Plausible origin hostname in public response bodies or redirects", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("analytics.lobst3rs.com", {
        status: 302,
        headers: {
          location: "https://analytics.lobst3rs.com/login",
        },
      }),
    );

    const response = await worker.fetch(makeRequest("/_analytics/js/script.js"), env);

    expect(response.headers.get("location")).toBeNull();
    expect(await response.text()).not.toContain("analytics.lobst3rs.com");
  });
});
