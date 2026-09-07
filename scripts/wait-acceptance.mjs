const urls = [`${process.env.TEST_API_URL || 'http://localhost:3015/api/v1'}/health/live`, process.env.TEST_WEB_URL || 'http://localhost:5173'];
for (const url of urls) {
  let ready = false;
  for (let attempt = 0; attempt < Number(process.env.ACCEPTANCE_STARTUP_SECONDS || 180); attempt++) {
    try { if ((await fetch(url, { signal: AbortSignal.timeout(2000) })).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  if (!ready) throw new Error(`Acceptance service did not become ready: ${url}`);
}
console.log('Acceptance services are ready.');
