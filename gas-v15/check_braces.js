import fs from 'fs';

const content = fs.readFileSync('meta-webhook-v24-complete.ts', 'utf8');
const lines = content.split('\n');

let open = 0;
const stack = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const char of line) {
        if (char === '{') {
            open++;
            stack.push(i + 1);
        } else if (char === '}') {
            open--;
            if (open < 0) {
                console.log(`Extra closing brace at line ${i + 1}`);
                process.exit(0);
            }
            stack.pop();
        }
    }
}

console.log(`Open braces count: ${open}`);
if (open > 0) {
    console.log(`Last opened brace at line: ${stack[stack.length - 1]}`);
    console.log(`Unclosed braces stack: ${stack.join(', ')}`);
}
