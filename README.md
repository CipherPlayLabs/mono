# abpiv-personal-brand

Docusaurus content site deployed to Cloudflare Pages at `https://allanbpediniv.com/info/`.

The site lives in `content-site/`. GitHub Actions builds, typechecks, and deploys it through the `Deploy to Cloudflare Pages` workflow.

Shared Plausible Analytics infrastructure lives in [`infra/analytics/`](infra/analytics/). It is repo-level infrastructure, not content-site-specific, so future sites should reuse the same OpenTofu, Ansible, and Worker patterns.

The `Analytics Infrastructure` workflow in [`.github/workflows/analytics-infra.yml`](.github/workflows/analytics-infra.yml) validates GCP authentication through GitHub OIDC and checks the analytics IaC, Worker, and content site build. It does not apply infrastructure or run production Ansible.

For the next AI or maintainer, start with the content-site handoff: [`content-site/AI_HANDOFF.md`](content-site/AI_HANDOFF.md).
