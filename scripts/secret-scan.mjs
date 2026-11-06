const patterns = [
  ["private key", /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g],
  ["AWS access key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  [
    "GitHub token",
    /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,})\b/g,
  ],
  ["Slack token", /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g],
  [
    "service API key",
    /\b(?:sk-(?:proj-|ant-)?[A-Za-z0-9_-]{24,}|AIza[A-Za-z0-9_-]{35})\b/g,
  ],
  [
    "credential in connection URL",
    /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^:\s/]+:[^@\s/]+@/gi,
  ],
  [
    "credential assignment",
    /\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|secret)\b["']?\s*[:=]\s*["']([^"'\r\n]{12,})["']/gi,
  ],
];
const placeholder =
  /^(?:example|placeholder|change[-_ ]?me|your[-_ ]|dummy|test[-_ ]|fake[-_ ]|<|\$\{|process\.env)/i;

export function scanSecrets(files) {
  const findings = [];
  for (const [file, source] of files) {
    for (const [label, pattern] of patterns) {
      pattern.lastIndex = 0;
      for (const match of source.matchAll(pattern)) {
        if (label === "credential assignment" && placeholder.test(match[1]))
          continue;
        const line = source.slice(0, match.index).split("\n").length;
        findings.push(`${file}:${line}: possible ${label} [REDACTED]`);
      }
    }
  }
  return findings;
}
