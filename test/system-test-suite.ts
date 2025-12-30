
import { AIPipelineController, EMERGENCY_PHRASE_CACHE } from '@/lib/aiPipelineController'
import { EmergencyFallbackSystem } from '@/components/EmergencyFallbackSystem'
import { performance } from 'perf_hooks'

// Mock browser APIs
if (typeof window === 'undefined') {
    global.window = {} as any
    global.localStorage = {
        getItem: () => null,
        setItem: () => null,
        removeItem: () => null
    } as any
}

// Result logger
const results: string[] = []
function log(msg: string) {
    console.log(msg)
    results.push(msg)
}
function assert(condition: boolean, msg: string) {
    if (condition) {
        log(`✅ PASS: ${msg}`)
    } else {
        log(`❌ FAIL: ${msg}`)
        throw new Error(msg)
    }
}

async function runSystemTests() {
    log('\n🚀 STARTING SYSTEM TEST SUITE')
    log('==================================================')

    // TEST 1: EMERGENCY MODE LATENCY
    log('\n🧪 TEST 1: EMERGENCY MODE LATENCY')
    const controller = new AIPipelineController()
    const context = { mode: 'hearing-to-deaf' as const, context: 'emergency' as const }

    // Test cached phrase 'help'
    const start = performance.now()
    let responseTime = 0

    // Listen for the 'speaking' status to mark response time
    const responsePromise = new Promise<void>((resolve) => {
        const onStatus = (status: string) => {
            if (status === 'speaking') {
                responseTime = performance.now() - start
                // @ts-ignore
                controller.off('status', onStatus)
                resolve()
            }
        }
        controller.on('status', onStatus)
    })

    // Start processing (don't await completion yet)
    const processPromise = controller.processInput(
        { type: 'speech', transcript: 'help' },
        context,
        true // Emergency mode enabled
    )

    await responsePromise // Wait for 'speaking' status

    log(`Time to response: ${responseTime.toFixed(2)}ms`)
    assert(responseTime < 150, `Emergency response should be instant (took ${responseTime.toFixed(2)}ms)`)

    // Wait for full completion to clean up
    await processPromise

    // TEST 2: FALLBACK RESILIENCE
    log('\n🧪 TEST 2: MEDIATION FAILURE FALLBACK')
    // We can't easily mock the internal mediator call without DI or mocking frameworks,
    // but we can test the fall-through behavior by sending a generic phrase in emergency mode
    // that ISN'T in the cache (forcing "AI" path which we optimized timings for)

    const start2 = performance.now()
    await controller.processInput(
        { type: 'speech', transcript: 'unique phrase not in cache' },
        context,
        true
    )
    const end2 = performance.now()
    const duration2 = end2 - start2

    // Even if it "fails" or runs, we expect it to return fast due to emergency timings
    // Note: In real run without mocking, this might actually call Gemini if key is set,
    // but we set timings to be fast.
    log(`Fallback/Miss path duration: ${duration2.toFixed(2)}ms`)
    assert(duration2 < 2000, 'Emergency AI path should still be reasonably fast')

    // TEST 3: VERIFY CACHE INTEGRITY
    log('\n🧪 TEST 3: CRITICAL PHRASE CACHE INTEGRITY')
    const criticalPhrases = ['help', 'call 911', 'chest pain']
    criticalPhrases.forEach(phrase => {
        assert(EMERGENCY_PHRASE_CACHE.has(phrase), `Cache must contain '${phrase}'`)
    })

    log('\n==================================================')
    log('🎉 ALL SYSTEM TESTS COMPLETED')

    return results.join('\n')
}

// Run if called directly
if (require.main === module) {
    runSystemTests().catch(e => {
        console.error(e)
        process.exit(1)
    })
}

export { runSystemTests }
