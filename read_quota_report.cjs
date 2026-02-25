const fs = require('fs');

function main() {
    const csvData = fs.readFileSync('teamfire_feb_quota_report.csv', 'utf8');
    const lines = csvData.trim().split('\n');

    // Skip header
    const dataLines = lines.slice(1);

    const activeOverLimit = [];
    const inactivePending = [];

    dataLines.forEach(line => {
        // Simple CSV parse handling quotes
        const cols = line.split('","').map(c => c.replace(/^"|"$/g, ''));
        if (cols.length < 9) return;

        const [name, email, isActive, plan, payDate, promised, delivered, pending, statusFlag] = cols;

        if (statusFlag.includes('SHOULD BE STOPPED')) {
            activeOverLimit.push({ name, plan, payDate, promised, delivered, pending });
        } else if (statusFlag.includes('STOPPED EARLY')) {
            inactivePending.push({ name, plan, payDate, promised, delivered, pending });
        }
    });

    console.log("=== THE 3 ACTIVE USERS WHO EXCEEDED QUOTA ===");
    activeOverLimit.forEach(u => {
        console.log(`- ${u.name} | Plan: ${u.plan} | Payment: ${u.payDate}`);
        console.log(`  > Promised: ${u.promised} | Delivered: ${u.delivered} | Over by: ${u.delivered - u.promised}`);
    });

    console.log("\n=== THE 37 INACTIVE USERS WITH PENDING LEADS ===");
    inactivePending.forEach(u => {
        console.log(`- ${u.name} | Plan: ${u.plan} | Payment: ${u.payDate}`);
        console.log(`  > Promised: ${u.promised} | Delivered: ${u.delivered} | PENDING: ${u.pending}`);
    });
}

main();
