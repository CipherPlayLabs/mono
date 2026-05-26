import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const opentofuDir = resolve(import.meta.dirname, "../../opentofu");

describe("OpenTofu worker artifact", () => {
  it("deploys the built analytics Worker instead of an inline placeholder", () => {
    const cloudflareConfig = readFileSync(resolve(opentofuDir, "cloudflare.tf"), "utf8");
    const localsConfig = readFileSync(resolve(opentofuDir, "locals.tf"), "utf8");

    expect(cloudflareConfig).toContain('file("${path.module}/../worker/dist/index.js")');
    expect(cloudflareConfig).toContain('name = "PLAUSIBLE_ORIGIN_HOSTNAME"');
    expect(cloudflareConfig).toContain("text = var.plausible_hostname");
    expect(cloudflareConfig).toContain('name = "CF_ACCESS_CLIENT_SECRET"');
    expect(cloudflareConfig).toContain('type = "secret_text"');
    expect(localsConfig).not.toContain("analytics_proxy_worker_script");
  });
});
