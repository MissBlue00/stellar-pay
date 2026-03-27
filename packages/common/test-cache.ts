import { redisClient, Cacheable, CacheInvalidate, TransactionStatusCache } from './src/cache';

class TestService {
    @Cacheable('expensive_op')
    async getExpensiveData(id: string) {
        console.log(`[TestService] Fetching Expensive Data for ${id}...`);
        return { data: `Expensive result ${id}` };
    }

    @CacheInvalidate('expensive_op')
    async updateData(id: string) {
        console.log(`[TestService] Updating Data for ${id}...`);
        return { success: true };
    }
}

async function runTest() {
    const service = new TestService();

    console.log('--- Testing Decorators ---');
    // 1st call: Cache Miss
    await service.getExpensiveData('123');
    // 2nd call: Cache Hit
    await service.getExpensiveData('123');

    // Update data: Invalidate Cache
    await service.updateData('123');

    // 3rd call: Cache Miss again
    await service.getExpensiveData('123');

    console.log('\n--- Testing Transaction Status Cache ---');
    // 1st call: Cache Miss
    await TransactionStatusCache.getStatus('TX_999');

    // Set cache
    await TransactionStatusCache.setStatus('TX_999', 'COMPLETED');

    // 2nd call: Cache Hit
    await TransactionStatusCache.getStatus('TX_999');

    // Invalidate cache
    await TransactionStatusCache.invalidateStatus('TX_999');

    // 3rd call: Cache Miss
    await TransactionStatusCache.getStatus('TX_999');

    // Close redis connection to exit the script
    await redisClient.quit();
}

runTest().catch(console.error);
