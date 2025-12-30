
import { runSystemTests } from './system-test-suite'
import { runExtendedTests } from './extended-system-tests'
import fs from 'fs'
import path from 'path'

async function main() {
    try {
        console.log("Running System Tests...")
        const systemResults = await runSystemTests()

        console.log("\nRunning Extended Tests...")
        const extendedResults = await runExtendedTests()

        const combinedResults = systemResults + "\n\n" + extendedResults

        const reportPath = path.join(process.cwd(), 'test', 'test-results.md')

        const report = `# System Test Report
    
**Date:** ${new Date().toISOString()}

\`\`\`
${combinedResults}
\`\`\`
`
        fs.writeFileSync(reportPath, report)
        console.log(`\n📄 Report saved to: ${reportPath}`)
    } catch (error) {
        console.error('Test Suite Failed:', error)
        process.exit(1)
    }
}

main()
