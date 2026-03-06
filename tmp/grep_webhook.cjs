const fs = require('fs');

const lines = fs.readFileSync('supabase/functions/meta-webhook/index.ts', 'utf8').split('\n');

console.log("=== .catch OCCURRENCES ===");
lines.forEach((line, index) => {
    if (line.includes('.catch(')) {
        console.log(`Line ${index + 1}: ${line}`);
    }
});

console.log("\n=== supabase.rpc OCCURRENCES ===");
lines.forEach((line, index) => {
    if (line.includes('supabase.rpc(')) {
        console.log(`Line ${index + 1}: ${line}`);
    }
});
