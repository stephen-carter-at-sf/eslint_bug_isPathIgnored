import {ESLint, Linter} from "eslint";
import {globalIgnores} from "eslint/config";
import js from "@eslint/js";
import ts from "typescript-eslint";

test1With('/some/path', '/some/path/dummy.js', false);       // [PASS]
test1With(undefined, '/some/path/dummy.js', false);          // [FAIL] - WHY? I'm still supplying an absolute path
test1With('/some/path/other', '/some/path/dummy.js', false); // [FAIL] - WHY? I'm still supplying an absolute path
test1With('/some/path', '/some/path/dummy.mjs', true);       // [FAIL] - WHY? I say that I only want *.js files ...
test1With(undefined, 'dummy.mjs', true);                     // [FAIL] - WHY? ... and I'm even ignoring *.mjs files
test1With('/some/path', '/some/path/dummy.ts', true);        // [PASS]
test1With(undefined, 'dummy.ts', true);                      // [PASS]

test2With('/some/path', '/some/path/dummy.js', true);        // [FAIL] - WHY? I say that I only want *.ts files ...
test2With(undefined, '/some/path/dummy.js', true);           // [PASS] - This seems inconsistent with test1
test2With('/some/path/other', '/some/path/dummy.js', true);  // [PASS]
test2With('/some/path/', 'dummy.js', true);                  // [FAIL] - WHY? This makes no sense to me
test2With('/some/path', '/some/path/dummy.mjs', true);       // [FAIL] - WHY? I don't want .mjs files at all ...
test2With(undefined, 'dummy.mjs', true);                     // [FAIL] - WHY? ... ditto
test2With('/some/path', '/some/path/dummy.ts', false);       // [PASS]
test2With(undefined, 'dummy.ts', false);                     // [PASS]

async function test1With(cwdValue, file, expected) {
    const eslint = new ESLint({
        cwd: cwdValue,
        baseConfig: [{
            ... js.configs.recommended,
            files: ["**/*.js"],
            ignores: ["**/*.mjs"] // Even explicitely ignoring *.mjs files but it doesn't work
        }],
        overrideConfigFile: true
    });
    
    const ignored = await eslint.isPathIgnored(file);
    
    const header = `\nTest1: ${JSON.stringify({cwd: cwdValue, file: file})}`;
    printResult(`\nTest1: ${JSON.stringify({cwd: cwdValue, file: file})}`, ignored, expected);
}

async function test2With(cwdValue, file, expected) {
    const eslint = new ESLint({
        cwd: cwdValue,

        // Imagine if I wanted to add in a config after this that does apply to javascript ...
        // I first need javascript to not apply to these... but they do for some wierd reason.
        // There seems to be no way to ignore js files with a subset of configs so that they
        // only apply to typescript and vice verca. If I use a global ignore then it doesn't
        // then let me add more configs that do apply to javascript.
        baseConfig: ts.configs.recommended.map(c => {
            c.files = ["**/*.ts"];
            c.ignores = ["**/*.js","**/*.cjs","**/*.mjs"];
            return c;
        }),

        overrideConfigFile: true
    });
    
    const ignored = await eslint.isPathIgnored(file);
    
    printResult(`\nTest2: ${JSON.stringify({cwd: cwdValue, file: file})}`, ignored, expected);
}

function printResult(header, actual, expected) {
    if (actual != expected) {
        console.log(`${header}\n  [FAIL] isPathIgnored returned ${actual} but expected ${expected}`);
    } else {
        console.log(`${header}\n  [PASS] isPathIgnored returned ${actual} as expected`);
    }
}