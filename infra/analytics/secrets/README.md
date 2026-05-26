# Analytics Secrets

This directory is reserved for encrypted analytics secret material and examples. Do not commit plaintext secrets.

Required secret names or references:

- Plausible `SECRET_KEY_BASE`
- Cloudflare API token with least privilege for DNS, Tunnel, Access, and Workers
- Cloudflare account ID and zone IDs, if they are not read from repository variables
- SOPS age recipient information
- GCS backup encryption secret or key reference

Use SOPS-managed encrypted files for committed secret manifests. If GitHub Actions ever needs to decrypt those files, add `SOPS_AGE_KEY` as a repository secret; otherwise keep decryption keys outside GitHub.
