# abpiv-personal-brand

Docusaurus content site deployed to Cloudflare Pages at `https://allanbpediniv.com/info/`.

For future coding agents, start with [`AGENTS.md`](AGENTS.md). It captures the current production state, analytics deployment map, workflow approval flow, and verification commands.

The site lives in `content-site/`. GitHub Actions builds, typechecks, and deploys it through the `Site and Analytics` workflow.

Shared Plausible Analytics infrastructure lives in [`infra/analytics/`](infra/analytics/). It is repo-level infrastructure, not content-site-specific, so future sites should reuse the same OpenTofu, Ansible, and Worker patterns.

The `Site and Analytics` workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) validates GCP authentication through GitHub OIDC, checks the analytics IaC, tests the Worker, builds the content site, and deploys Cloudflare Pages. Manual infrastructure workflows live in [`.github/workflows/analytics-apply.yml`](.github/workflows/analytics-apply.yml) and [`.github/workflows/analytics-provision.yml`](.github/workflows/analytics-provision.yml).

For the next AI or maintainer, start with the content-site handoff: [`content-site/AI_HANDOFF.md`](content-site/AI_HANDOFF.md).
