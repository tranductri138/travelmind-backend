/**
 * Sync PostgreSQL data → AI service (Qdrant vector store).
 *
 * Goi POST /ai/sync de AI service doc tat ca hotels + reviews
 * tu PostgreSQL roi embed vao Qdrant cho semantic search.
 *
 * Chay sau khi prisma migrate xong:
 *   npx tsx prisma/sync-ai.ts
 *
 * Environment:
 *   AI_SERVICE_URL  (default: http://localhost:8000)
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const SYNC_ENDPOINT = `${AI_SERVICE_URL}/ai/sync`;
const HEALTH_ENDPOINT = `${AI_SERVICE_URL}/health`;
const TIMEOUT_MS = 60_000;

async function waitForAiService(retries = 5, delayMs = 2000): Promise<boolean> {
  for (let i = 1; i <= retries; i++) {
    try {
      const res = await fetch(HEALTH_ENDPOINT, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) return true;
    } catch {
      // ignore
    }
    if (i < retries) {
      console.log(`  AI service not ready, retry ${i}/${retries}...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return false;
}

async function main() {
  console.log(`\n🔄 Syncing data to AI service (${AI_SERVICE_URL})...\n`);

  // 1. Check AI service health
  const healthy = await waitForAiService();
  if (!healthy) {
    console.warn('⚠️  AI service is not reachable — skipping sync.');
    console.warn(`   Make sure AI service is running at ${AI_SERVICE_URL}`);
    process.exit(0); // exit 0 so pipeline doesn't fail
  }

  // 2. Call sync endpoint
  try {
    const res = await fetch(SYNC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`❌ Sync failed (HTTP ${res.status}): ${text}`);
      process.exit(1);
    }

    const data = await res.json();
    console.log('✅ Sync completed:');
    console.log(
      `   Hotels: ${data.synced_hotels ?? data.synced_hotels ?? '?'}/${data.total_hotels ?? '?'}`,
    );
    console.log(
      `   Reviews: ${data.synced_reviews ?? data.synced_reviews ?? '?'}/${data.total_reviews ?? '?'}`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ Sync request failed: ${msg}`);
    process.exit(1);
  }
}

main();
