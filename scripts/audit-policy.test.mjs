import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

import { evaluateAuditReport } from './audit-policy.mjs';

const ACCEPTED_ADVISORY = 'https://github.com/advisories/GHSA-g3hv-75wg-m249';
const CLI = fileURLToPath(new URL('./audit-check.mjs', import.meta.url));
const FIXTURE_DIR = mkdtempSync(join(tmpdir(), 'ju-keramia-audit-'));

afterAll(() => {
  rmSync(FIXTURE_DIR, { recursive: true, force: true });
});

function advisory(url = ACCEPTED_ADVISORY, overrides = {}) {
  return {
    source: 1,
    name: 'minimatch',
    dependency: 'minimatch',
    title: 'synthetic advisory',
    url,
    severity: 'moderate',
    range: '<11.0.1',
    ...overrides,
  };
}

function approvedChain() {
  return {
    minimatch: {
      name: 'minimatch',
      severity: 'moderate',
      via: [advisory()],
      effects: ['eslint-plugin-import-x'],
      range: '<11.0.1',
      nodes: ['node_modules/minimatch'],
    },
    'eslint-plugin-import-x': {
      name: 'eslint-plugin-import-x',
      severity: 'moderate',
      via: ['minimatch'],
      effects: ['@nuxt/eslint-config'],
      nodes: ['node_modules/eslint-plugin-import-x'],
    },
    '@nuxt/eslint-config': {
      name: '@nuxt/eslint-config',
      severity: 'moderate',
      via: ['eslint-plugin-import-x'],
      effects: ['@nuxt/eslint'],
      nodes: ['node_modules/@nuxt/eslint-config'],
    },
    '@nuxt/eslint': {
      name: '@nuxt/eslint',
      severity: 'moderate',
      via: ['@nuxt/eslint-config'],
      effects: [],
      nodes: ['node_modules/@nuxt/eslint'],
    },
  };
}

function buildReport(vulnerabilities) {
  const counts = { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 };
  for (const entry of Object.values(vulnerabilities)) {
    counts[entry.severity] += 1;
    counts.total += 1;
  }
  return {
    auditReportVersion: 2,
    vulnerabilities,
    metadata: { vulnerabilities: counts },
  };
}

function runCli(reportText) {
  const fileName = `report-${Math.random().toString(36).slice(2)}.json`;
  const filePath = join(FIXTURE_DIR, fileName);
  writeFileSync(filePath, reportText, 'utf8');
  return spawnSync(process.execPath, [CLI, filePath], { encoding: 'utf8' });
}

describe('evaluateAuditReport — accepted exception', () => {
  it('accepts the reviewed ESLint tooling chain only', () => {
    const result = evaluateAuditReport(buildReport(approvedChain()));

    expect(result.ok).toBe(true);
    expect(result.error).toBeNull();
    expect(result.blocking).toEqual([]);
    expect(result.accepted.sort()).toEqual([
      '@nuxt/eslint',
      '@nuxt/eslint-config',
      'eslint-plugin-import-x',
      'minimatch',
    ]);
  });

  it('ignores low and info findings, matching the previous moderate threshold', () => {
    const result = evaluateAuditReport(
      buildReport({
        ...approvedChain(),
        deepmerge: {
          name: 'deepmerge',
          severity: 'low',
          via: [
            advisory('https://github.com/advisories/GHSA-gcqx-w48m-w2h4', { name: 'deepmerge' }),
          ],
          effects: [],
        },
      })
    );

    expect(result.ok).toBe(true);
    expect(result.blocking).toEqual([]);
  });
});

describe('evaluateAuditReport — unaccepted findings still fail', () => {
  it('blocks an unrelated moderate vulnerability', () => {
    const result = evaluateAuditReport(
      buildReport({
        ...approvedChain(),
        'some-unrelated-package': {
          name: 'some-unrelated-package',
          severity: 'moderate',
          via: [advisory('https://github.com/advisories/GHSA-aaaa-bbbb-cccc')],
          effects: [],
        },
      })
    );

    expect(result.ok).toBe(false);
    expect(result.blocking.map((entry) => entry.name)).toEqual(['some-unrelated-package']);
  });

  it('blocks an unrelated high vulnerability', () => {
    const result = evaluateAuditReport(
      buildReport({
        ...approvedChain(),
        'some-unrelated-package': {
          name: 'some-unrelated-package',
          severity: 'high',
          via: [
            advisory('https://github.com/advisories/GHSA-dddd-eeee-ffff', { severity: 'high' }),
          ],
          effects: [],
        },
      })
    );

    expect(result.ok).toBe(false);
    expect(result.blocking.map((entry) => entry.severity)).toEqual(['high']);
  });

  it('blocks an unrelated critical vulnerability', () => {
    const result = evaluateAuditReport(
      buildReport({
        ...approvedChain(),
        'some-unrelated-package': {
          name: 'some-unrelated-package',
          severity: 'critical',
          via: [
            advisory('https://github.com/advisories/GHSA-gggg-hhhh-iiii', { severity: 'critical' }),
          ],
          effects: [],
        },
      })
    );

    expect(result.ok).toBe(false);
    expect(result.blocking.map((entry) => entry.severity)).toEqual(['critical']);
  });

  it('blocks the advisory when the vulnerable minimatch is reachable outside the ESLint chain', () => {
    const chain = approvedChain();
    chain.minimatch.effects = ['eslint-plugin-import-x', 'some-other-plugin'];
    chain['some-other-plugin'] = {
      name: 'some-other-plugin',
      severity: 'moderate',
      via: ['minimatch'],
      effects: [],
    };

    const result = evaluateAuditReport(buildReport(chain));

    expect(result.ok).toBe(false);
    expect(result.blocking.map((entry) => entry.name).sort()).toEqual([
      '@nuxt/eslint',
      '@nuxt/eslint-config',
      'eslint-plugin-import-x',
      'minimatch',
      'some-other-plugin',
    ]);
  });

  it('blocks the advisory when an additional advisory also affects minimatch', () => {
    const chain = approvedChain();
    chain.minimatch.via = [
      advisory(),
      advisory('https://github.com/advisories/GHSA-jjjj-kkkk-llll'),
    ];

    const result = evaluateAuditReport(buildReport(chain));

    expect(result.ok).toBe(false);
    expect(result.blocking.map((entry) => entry.name)).toContain('minimatch');
  });

  it('blocks the advisory when npm escalates its severity above moderate', () => {
    const chain = approvedChain();
    for (const entry of Object.values(chain)) {
      entry.severity = 'high';
    }
    chain.minimatch.via = [advisory(ACCEPTED_ADVISORY, { severity: 'high' })];

    const result = evaluateAuditReport(buildReport(chain));

    expect(result.ok).toBe(false);
    expect(result.blocking.map((entry) => entry.name)).toContain('minimatch');
  });

  it('blocks the advisory when the entry stays moderate but the advisory severity is critical', () => {
    const chain = approvedChain();
    chain.minimatch.via = [advisory(ACCEPTED_ADVISORY, { severity: 'critical' })];

    const result = evaluateAuditReport(buildReport(chain));

    expect(result.ok).toBe(false);
    expect(result.blocking.map((entry) => entry.name)).toContain('minimatch');
  });

  it('blocks the advisory when the advisory severity is low', () => {
    const chain = approvedChain();
    chain.minimatch.via = [advisory(ACCEPTED_ADVISORY, { severity: 'low' })];

    const result = evaluateAuditReport(buildReport(chain));

    expect(result.ok).toBe(false);
    expect(result.blocking.map((entry) => entry.name)).toContain('minimatch');
  });

  it('blocks the advisory when the advisory package name is missing', () => {
    const chain = approvedChain();
    const via = advisory();
    delete via.name;
    chain.minimatch.via = [via];

    const result = evaluateAuditReport(buildReport(chain));

    expect(result.ok).toBe(false);
    expect(result.blocking.map((entry) => entry.name)).toContain('minimatch');
  });

  it('blocks the advisory when the advisory package name is not minimatch', () => {
    const chain = approvedChain();
    chain.minimatch.via = [advisory(ACCEPTED_ADVISORY, { name: 'brace-expansion' })];

    const result = evaluateAuditReport(buildReport(chain));

    expect(result.ok).toBe(false);
    expect(result.blocking.map((entry) => entry.name)).toContain('minimatch');
  });
});

describe('evaluateAuditReport — malformed or failed audits cannot pass', () => {
  it('rejects a report that contains a top-level npm error', () => {
    const result = evaluateAuditReport({
      error: { code: 'ENETUNREACH', summary: 'network unavailable' },
    });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/ENETUNREACH/);
  });

  it('reports the npm message when the failure payload has no code or summary', () => {
    const result = evaluateAuditReport({
      message: 'request to https://registry.npmjs.org failed, reason: connect ECONNREFUSED',
      error: { summary: '', detail: '' },
    });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/ECONNREFUSED/);
  });

  it('rejects a report without audit metadata', () => {
    const result = evaluateAuditReport({ auditReportVersion: 2, vulnerabilities: {} });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/metadata/);
  });

  it('rejects a report whose counts contradict its vulnerability list', () => {
    const report = buildReport(approvedChain());
    report.metadata.vulnerabilities.moderate = 0;

    const result = evaluateAuditReport(report);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/inconsistent/);
  });

  it('rejects a report with an unknown severity instead of guessing', () => {
    const chain = approvedChain();
    chain.minimatch.severity = 'unknown';

    const result = evaluateAuditReport(buildReport(chain));

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/unknown/);
  });

  it.each([
    ['a null report', null],
    ['a string report', 'not json'],
    ['an empty object', {}],
  ])('rejects %s', (_label, report) => {
    expect(evaluateAuditReport(report).ok).toBe(false);
  });
});

describe('audit-check CLI', () => {
  it('exits 0 for the reviewed chain, reporting the accepted exception', () => {
    const result = runCli(JSON.stringify(buildReport(approvedChain())));

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('GHSA-g3hv-75wg-m249');
  });

  it('exits 1 for an unrelated moderate vulnerability', () => {
    const result = runCli(
      JSON.stringify(
        buildReport({
          ...approvedChain(),
          'some-unrelated-package': {
            name: 'some-unrelated-package',
            severity: 'moderate',
            via: [advisory('https://github.com/advisories/GHSA-aaaa-bbbb-cccc')],
            effects: [],
          },
        })
      )
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('some-unrelated-package');
  });

  it('exits 1 for a high vulnerability', () => {
    const result = runCli(
      JSON.stringify(
        buildReport({
          ...approvedChain(),
          'some-unrelated-package': {
            name: 'some-unrelated-package',
            severity: 'high',
            via: [
              advisory('https://github.com/advisories/GHSA-dddd-eeee-ffff', { severity: 'high' }),
            ],
            effects: [],
          },
        })
      )
    );

    expect(result.status).toBe(1);
  });

  it('exits 1 when the report cannot be parsed', () => {
    const result = runCli('{ this is not json');

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/could not parse/);
  });

  it('exits 1 when the report file is missing', () => {
    const result = spawnSync(process.execPath, [CLI, join(FIXTURE_DIR, 'does-not-exist.json')], {
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
  });
});
