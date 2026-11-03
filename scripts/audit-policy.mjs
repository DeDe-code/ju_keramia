/**
 * Dependency security audit policy for Ju Keramia.
 *
 * `npm audit` is all-or-nothing: it exits non-zero for every reported vulnerability, including
 * low-severity ones, and it has no allow-list. This module turns an `npm audit --json` report
 * into a decision so CI can stay strict:
 *
 * - every moderate, high, or critical finding fails the gate;
 * - a finding is tolerated only when it is covered by a reviewed exception described in
 *   SECURITY_AUDIT_EXCEPTIONS.md;
 * - a failed, empty, or internally inconsistent audit report fails the gate instead of passing.
 *
 * The module is intentionally free of I/O so the policy can be exercised against synthetic
 * reports. `scripts/audit-check.mjs` is the thin command-line wrapper.
 */

/** Severities that must fail the gate. Matches the previous `npm audit --audit-level=moderate`. */
export const BLOCKING_SEVERITIES = ['moderate', 'high', 'critical'];

export const KNOWN_SEVERITIES = ['info', 'low', 'moderate', 'high', 'critical'];

/**
 * Reviewed exception: minimatch <11.0.1, advisory GHSA-g3hv-75wg-m249 (moderate).
 *
 * This object is the single source of truth for the exception. Every field must match exactly, so
 * a report that reuses the approved URL for a different package or a different advisory severity
 * is rejected instead of inheriting the exception.
 */
const REVIEWED_ADVISORY = {
  url: 'https://github.com/advisories/GHSA-g3hv-75wg-m249',
  packageName: 'minimatch',
  severity: 'moderate',
};

/** Advisories the exception covers. Exported for the command-line summary. */
export const ACCEPTED_ADVISORY_URLS = [REVIEWED_ADVISORY.url];

/**
 * The only dependency chain the exception may cover, ordered leaf -> root.
 *
 * Every entry is development tooling: ESLint and its Nuxt configuration. None of it is part of
 * the production server bundle or handles untrusted runtime input. The vulnerable minimatch copy
 * must also have `eslint-plugin-import-x` as its *only* dependent, so the exception cannot silently
 * widen to another consumer of the same package.
 */
export const ACCEPTED_CHAIN = [
  'minimatch',
  'eslint-plugin-import-x',
  '@nuxt/eslint-config',
  '@nuxt/eslint',
];

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The exception is valid only for the exact reviewed advisory. Checking URL, package, and
 * severity together prevents a differently-shaped advisory from inheriting the tolerance.
 */
function isReviewedAdvisory(via) {
  return (
    isPlainObject(via) &&
    via.url === REVIEWED_ADVISORY.url &&
    via.name === REVIEWED_ADVISORY.packageName &&
    via.severity === REVIEWED_ADVISORY.severity
  );
}

function failure(error) {
  return { ok: false, error, accepted: [], blocking: [] };
}

function describeAdvisory(via) {
  return typeof via === 'string'
    ? { dependency: via }
    : { url: via.url, title: via.title, severity: via.severity };
}

function describeAuditError(report) {
  const error = report.error;
  const parts = [];

  if (isPlainObject(error)) {
    for (const field of ['code', 'summary', 'detail']) {
      if (typeof error[field] === 'string' && error[field].trim() !== '') {
        parts.push(error[field].trim());
      }
    }
  }

  // npm's failure payload often carries the useful text in the top-level `message` only.
  if (parts.length === 0 && typeof report.message === 'string' && report.message.trim() !== '') {
    parts.push(report.message.trim());
  }

  return parts.length === 0 ? 'unknown npm audit error' : parts.join(': ');
}

/**
 * A leaf entry is tolerated only when every advisory behind it is the reviewed advisory and the
 * vulnerable package has exactly the expected single dependent.
 */
function isAcceptedLeaf(entry) {
  const onlyReviewedAdvisories = entry.via.length > 0 && entry.via.every(isReviewedAdvisory);
  const onlyExpectedDependent =
    entry.effects.length === 1 && entry.effects[0] === 'eslint-plugin-import-x';

  return onlyReviewedAdvisories && onlyExpectedDependent;
}

/**
 * Aggregated entries inherit their severity from the chain below them. They are tolerated only
 * when they point at an already accepted child and depend on nothing outside the chain.
 */
function isAcceptedDependent(name, entry, accepted) {
  const index = ACCEPTED_CHAIN.indexOf(name);
  const child = ACCEPTED_CHAIN[index - 1];

  if (index <= 0 || !accepted.has(child)) {
    return false;
  }

  const viaAcceptedChild = entry.via.length > 0 && entry.via.every((via) => via === child);
  const dependsOnlyOnChain = entry.effects.every(
    (effect) => ACCEPTED_CHAIN.indexOf(effect) > index
  );

  return viaAcceptedChild && dependsOnlyOnChain;
}

/**
 * @param {unknown} report Parsed `npm audit --json` payload.
 * @returns {{ ok: boolean, error: string | null, accepted: string[], blocking: object[] }}
 */
export function evaluateAuditReport(report) {
  if (!isPlainObject(report)) {
    return failure('audit report is not an object');
  }

  if (report.error !== undefined && report.error !== null) {
    return failure(`npm audit failed: ${describeAuditError(report)}`);
  }

  if (typeof report.auditReportVersion !== 'number') {
    return failure('unsupported audit report: missing numeric auditReportVersion');
  }

  const metadataCounts = report.metadata?.vulnerabilities;
  if (!isPlainObject(metadataCounts)) {
    return failure('unsupported audit report: missing metadata.vulnerabilities');
  }

  for (const severity of [...KNOWN_SEVERITIES, 'total']) {
    if (typeof metadataCounts[severity] !== 'number') {
      return failure(`unsupported audit report: missing metadata.vulnerabilities.${severity}`);
    }
  }

  if (!isPlainObject(report.vulnerabilities)) {
    return failure('unsupported audit report: missing vulnerabilities map');
  }

  for (const [name, entry] of Object.entries(report.vulnerabilities)) {
    if (!isPlainObject(entry)) {
      return failure(`unsupported audit report: vulnerability entry "${name}" is not an object`);
    }
    if (!KNOWN_SEVERITIES.includes(entry.severity)) {
      return failure(
        `unsupported audit report: unknown severity "${entry.severity}" for "${name}"`
      );
    }
    if (
      !Array.isArray(entry.effects) ||
      entry.effects.some((effect) => typeof effect !== 'string')
    ) {
      return failure(`unsupported audit report: invalid effects list for "${name}"`);
    }
    if (
      !Array.isArray(entry.via) ||
      entry.via.some((via) => typeof via !== 'string' && !isPlainObject(via))
    ) {
      return failure(`unsupported audit report: invalid via list for "${name}"`);
    }
  }

  // The metadata counters must agree with the detailed list. A report that disagrees with itself
  // is treated as malformed rather than as evidence that nothing is wrong.
  const actualCounts = Object.fromEntries(KNOWN_SEVERITIES.map((severity) => [severity, 0]));
  for (const entry of Object.values(report.vulnerabilities)) {
    actualCounts[entry.severity] += 1;
  }

  for (const severity of KNOWN_SEVERITIES) {
    if (actualCounts[severity] !== metadataCounts[severity]) {
      return failure(
        `inconsistent audit report: ${actualCounts[severity]} ${severity} findings reported but metadata claims ${metadataCounts[severity]}`
      );
    }
  }

  if (Object.keys(report.vulnerabilities).length !== metadataCounts.total) {
    return failure(
      `inconsistent audit report: ${Object.keys(report.vulnerabilities).length} findings reported but metadata claims ${metadataCounts.total}`
    );
  }

  const accepted = new Set();
  for (const name of ACCEPTED_CHAIN) {
    const entry = report.vulnerabilities[name];
    if (!entry || entry.severity !== 'moderate') {
      continue;
    }

    const isTolerated =
      ACCEPTED_CHAIN.indexOf(name) === 0
        ? isAcceptedLeaf(entry)
        : isAcceptedDependent(name, entry, accepted);

    if (isTolerated) {
      accepted.add(name);
    }
  }

  const blocking = Object.entries(report.vulnerabilities)
    .filter(([name, entry]) => !accepted.has(name) && BLOCKING_SEVERITIES.includes(entry.severity))
    .map(([name, entry]) => ({
      name,
      severity: entry.severity,
      range: typeof entry.range === 'string' ? entry.range : 'unknown',
      advisories: entry.via.map(describeAdvisory),
    }));

  return {
    ok: blocking.length === 0,
    error: null,
    accepted: [...accepted],
    blocking,
  };
}
