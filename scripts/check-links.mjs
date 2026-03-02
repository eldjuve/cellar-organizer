#!/usr/bin/env node
// Verifies that the hardcoded CellarTracker wine URL is present in the source
// and that the endpoint is reachable. Runs as a predeploy hook.

import { readFileSync } from "fs";

const SOURCE_FILE = "app/components/CellarTrackerLink.tsx";
const EXPECTED_URL_PREFIX = "https://www.cellartracker.com/wine.asp?iWine=";
const PROBE_URL = `${EXPECTED_URL_PREFIX}1`;

// --- Static check ---
const source = readFileSync(SOURCE_FILE, "utf8");
if (!source.includes(EXPECTED_URL_PREFIX)) {
  console.error(`❌ CellarTracker URL not found in ${SOURCE_FILE}`);
  console.error(`   Expected: ${EXPECTED_URL_PREFIX}`);
  process.exit(1);
}
console.log(`✓ CellarTracker URL pattern found in ${SOURCE_FILE}`);

// --- Network check ---
let res;
try {
  res = await fetch(PROBE_URL, { method: "HEAD", redirect: "follow" });
} catch (err) {
  console.error(`❌ CellarTracker link unreachable: ${PROBE_URL}`);
  console.error(`   ${err.message}`);
  process.exit(1);
}

if (res.status >= 500) {
  console.error(`❌ CellarTracker returned ${res.status} for ${PROBE_URL}`);
  process.exit(1);
}
console.log(`✓ CellarTracker link reachable (HTTP ${res.status})`);
