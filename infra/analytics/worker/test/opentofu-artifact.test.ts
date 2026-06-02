import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const opentofuDir = resolve(import.meta.dirname, "../../opentofu");
const repoRoot = resolve(opentofuDir, "../../..");

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

  it("defaults the private dashboard origin to analytics.cipherinternal.com", () => {
    const analyticsReadme = readFileSync(resolve(opentofuDir, "../README.md"), "utf8");
    const ansibleVars = readFileSync(resolve(opentofuDir, "../ansible/group_vars/plausible.yml"), "utf8");
    const cloudflareConfig = readFileSync(resolve(opentofuDir, "cloudflare.tf"), "utf8");
    const opentofuReadme = readFileSync(resolve(opentofuDir, "README.md"), "utf8");
    const variablesConfig = readFileSync(resolve(opentofuDir, "variables.tf"), "utf8");
    const wranglerConfig = readFileSync(resolve(opentofuDir, "../worker/wrangler.jsonc"), "utf8");

    expect(variablesConfig).toContain('default     = "analytics.cipherinternal.com"');
    expect(cloudflareConfig).toContain("local.analytics_dashboard_zone_id");
    expect(wranglerConfig).toContain('"PLAUSIBLE_ORIGIN_HOSTNAME": "analytics.cipherinternal.com"');
    expect(ansibleVars).toContain("plausible_hostname: analytics.cipherinternal.com");

    for (const config of [
      analyticsReadme,
      ansibleVars,
      cloudflareConfig,
      opentofuReadme,
      variablesConfig,
      wranglerConfig,
    ]) {
      expect(config).not.toContain("lobst3rs");
    }
  });

  it("wires GitHub Actions to the cipherinternal dashboard zone", () => {
    const applyWorkflow = readFileSync(resolve(repoRoot, ".github/workflows/analytics-apply.yml"), "utf8");
    const provisionWorkflow = readFileSync(resolve(repoRoot, ".github/workflows/analytics-provision.yml"), "utf8");

    expect(applyWorkflow).toContain(
      "TF_VAR_analytics_dashboard_zone_name: ${{ vars.ANALYTICS_DASHBOARD_ZONE_NAME || 'cipherinternal.com' }}",
    );
    expect(applyWorkflow).toContain(
      "TF_VAR_plausible_hostname: ${{ vars.PLAUSIBLE_HOSTNAME || 'analytics.cipherinternal.com' }}",
    );
    expect(applyWorkflow).toContain(
      "CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_ANALYTICS_API_TOKEN || secrets.CLOUDFLARE_API_TOKEN }}",
    );
    expect(applyWorkflow).toContain("TOFU_STATE_BUCKET: cipherplay-analytics-opentofu-state");
    expect(applyWorkflow).toContain("Ensure OpenTofu state bucket");
    expect(applyWorkflow).toContain('--lifecycle-file="${TOFU_DIR}/state-lifecycle.json"');
    expect(provisionWorkflow).toContain(
      "PLAUSIBLE_HOSTNAME: ${{ vars.PLAUSIBLE_HOSTNAME || 'analytics.cipherinternal.com' }}",
    );
    expect(provisionWorkflow).toContain(
      "CLOUDFLARE_TUNNEL_NAME: ${{ vars.ANALYTICS_CLOUDFLARE_TUNNEL_NAME || 'plausible-analytics-origin' }}",
    );
    expect(provisionWorkflow).toContain('cfd_tunnel?name=${encoded_tunnel_name}&is_deleted=false');
    expect(applyWorkflow).not.toContain("TF_VAR_lobst3rs_zone_id");
    expect(applyWorkflow).not.toContain("CLOUDFLARE_ZONE_ID_LOBST3RS");
    expect(provisionWorkflow).not.toContain("4af10406-0f31-46ae-8d00-15ec71d2029f");
  });
});
