const ANALYTICS_PREFIX = "/_analytics";
const SCRIPT_ROUTE = `${ANALYTICS_PREFIX}/js/script.js`;
const EVENT_ROUTE = `${ANALYTICS_PREFIX}/api/event`;
const PRESERVED_REQUEST_HEADERS = [
  "user-agent",
  "x-forwarded-for",
  "accept-language",
  "referer",
] as const;

interface Env {
  PLAUSIBLE_ORIGIN_HOSTNAME: string;
  CF_ACCESS_CLIENT_ID?: string;
  CF_ACCESS_CLIENT_SECRET?: string;
}

function textResponse(message: string, status: number) {
  return new Response(message, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function getOriginHostname(env: Env) {
  const hostname = env.PLAUSIBLE_ORIGIN_HOSTNAME.trim();

  if (!hostname || hostname.includes("/") || hostname.includes(":")) {
    throw new Error("Invalid Plausible origin hostname binding");
  }

  return hostname;
}

function copyVisitorHeaders(from: Headers, to: Headers) {
  for (const header of PRESERVED_REQUEST_HEADERS) {
    const value = from.get(header);

    if (value !== null) {
      to.set(header, value);
    }
  }
}

function buildHeaders(request: Request) {
  const headers = new Headers();
  copyVisitorHeaders(request.headers, headers);

  const contentType = request.headers.get("content-type");
  if (contentType !== null) {
    headers.set("content-type", contentType);
  }

  return headers;
}

function addAccessServiceTokenHeaders(headers: Headers, env: Env) {
  const clientId = env.CF_ACCESS_CLIENT_ID?.trim();
  const clientSecret = env.CF_ACCESS_CLIENT_SECRET?.trim();

  if (clientId && clientSecret) {
    headers.set("CF-Access-Client-Id", clientId);
    headers.set("CF-Access-Client-Secret", clientSecret);
  }
}

async function sanitizeResponse(upstream: Response, originHostname: string, publicHostname: string) {
  const headers = new Headers(upstream.headers);
  const location = headers.get("location");

  if (location !== null) {
    headers.delete("location");
  }

  const body = await upstream.text();

  return new Response(body.replaceAll(originHostname, publicHostname), {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

async function proxyScript(request: Request, env: Env, originHostname: string) {
  const headers = buildHeaders(request);
  addAccessServiceTokenHeaders(headers, env);

  const upstreamRequest = new Request(`https://${originHostname}/js/script.js`, {
    method: "GET",
    headers,
    redirect: "manual",
  });

  return fetch(upstreamRequest);
}

async function proxyEvent(request: Request, env: Env, originHostname: string) {
  const headers = buildHeaders(request);
  addAccessServiceTokenHeaders(headers, env);

  const body = await request.arrayBuffer();
  const upstreamRequest = new Request(`https://${originHostname}/api/event`, {
    method: "POST",
    headers,
    body,
    redirect: "manual",
  });

  return fetch(upstreamRequest);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    try {
      const originHostname = getOriginHostname(env);
      let upstream: Response;

      if (url.pathname === SCRIPT_ROUTE) {
        if (request.method !== "GET") {
          return textResponse("Method not allowed", 405);
        }

        upstream = await proxyScript(request, env, originHostname);
      } else if (url.pathname === EVENT_ROUTE) {
        if (request.method !== "POST") {
          return textResponse("Method not allowed", 405);
        }

        upstream = await proxyEvent(request, env, originHostname);
      } else {
        return textResponse("Not found", 404);
      }

      return sanitizeResponse(upstream, originHostname, url.hostname);
    } catch {
      return textResponse("Analytics proxy error", 502);
    }
  },
};
