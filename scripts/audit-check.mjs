#!/usr/bin/env node
/**
 * Dependency security gate for Ju Keramia.
 *
 * Usage:
 *   node scripts/audit-check.mjs              # runs `npm audit --json` and applies the policy
 *   node scripts/audit-check.mjs report.json  # applies the policy to an existing report
 *
 * Exit code 0 means: no unaccepted moderate, high, or critical finding. Every other outcome —
 * including a failed audit, an empty response, or an unparsable report — exits with 1.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { ACCEPTED_ADVISORY_URLS, evaluateAuditReport } from './audit-policy.mjs';

const MAX_REPORT_BYTES = 64 * 1024 * 1024;
const MAX_STDERR_CHARS = 500;

function stderrSuffix(stderr) {
  const trimmed = typeof stderr === 'string' ? stderr.trim() : '';
  return trimmed === '' ? '' : `: ${trimmed.slice(0, MAX_STDERR_CHARS)}`;
}

function loadReport(reportPath) {
  if (reportPath) {
    return { source: `report file "${reportPath}"`, text: readFileSync(reportPath, 'utf8') };
  }

  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npm, ['audit', '--json'], {
    encoding: 'utf8',
    maxBuffer: MAX_REPORT_BYTES,
  });

  if (result.error) {
    throw new Error(`could not run "npm audit": ${result.error.message}`);
  }
  if (result.signal) {
    throw new Error(`"npm audit" was terminated by signal ${result.signal}`);
  }
  // npm exits 1 whenever it reports any vulnerability, including ones below the blocking
  // threshold, so the report itself decides. Only unexpected exit codes indicate a broken audit.
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(
      `"npm audit" exited with status ${result.status}${stderrSuffix(result.stderr)}`
    );
  }
  if (typeof result.stdout !== 'string' || result.stdout.trim() === '') {
    throw new Error(`"npm audit" produced no report${stderrSuffix(result.stderr)}`);
  }

  return { source: '"npm audit"', text: result.stdout };
}

function printAccepted(accepted) {
  if (accepted.length === 0) {
    return;
  }

  console.log('Accepted exception (documented in SECURITY_AUDIT_EXCEPTIONS.md):');
  console.log(`  advisory: ${ACCEPTED_ADVISORY_URLS.join(', ')}`);
  console.log(`  dependency chain: ${accepted.join(' -> ')}`);
}

function printBlocking(blocking) {
  console.error('Unaccepted findings:');
  for (const entry of blocking) {
    console.error(`  - ${entry.name} (${entry.severity}, affected range ${entry.range})`);
    for (const advisory of entry.advisories) {
      const detail = advisory.url ?? `depends on ${advisory.dependency}`;
      console.error(`      ${detail}${advisory.title ? ` — ${advisory.title}` : ''}`);
    }
  }
}

function main(argv) {
  let report;

  try {
    const { source, text } = loadReport(argv[2]);
    try {
      report = JSON.parse(text);
    } catch {
      throw new Error(`could not parse the report from ${source}`);
    }
  } catch (error) {
    console.error(`::error::Dependency security audit could not run: ${error.message}`);
    return 1;
  }

  const result = evaluateAuditReport(report);

  if (result.error) {
    console.error(`::error::Dependency security audit rejected the report: ${result.error}`);
    return 1;
  }

  printAccepted(result.accepted);

  if (!result.ok) {
    printBlocking(result.blocking);
    console.error(
      `::error::Dependency security audit failed: ${result.blocking.length} unaccepted moderate, high, or critical finding(s).`
    );
    return 1;
  }

  console.log(
    'Dependency security audit passed: no unaccepted moderate, high, or critical findings.'
  );
  return 0;
}

process.exitCode = main(process.argv);
