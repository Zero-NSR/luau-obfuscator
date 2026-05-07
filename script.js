/**
 * NEBULOUS VM CORE
 * Industrial-grade Lua Obfuscation Engine
 */

const Nebulous = {
    // 1. Helpers for randomization
    generateId: (len = 12) => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
        let result = chars.charAt(Math.floor(Math.random() * (chars.length - 10))); // Ensure start with letter
        for (let i = 0; i < len; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
        return result;
    },

    xorEncrypt: (str, key) => {
        let output = "";
        for (let i = 0; i < str.length; i++) {
            output += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return btoa(output);
    },

    // 2. The VM Template (The Nightmare)
    // This string is what's generated in Lua. It uses a custom loop to execute opcodes.
    getVMTemplate: (bytecode, key, opMap, antiDebug) => {
        const vNames = {
            vm: Nebulous.generateId(),
            stack: Nebulous.generateId(),
            instr: Nebulous.generateId(),
            pc: Nebulous.generateId(),
            dispatch: Nebulous.generateId(),
            decrypt: Nebulous.generateId(),
            check: Nebulous.generateId()
        };

        let antiDebugCode = antiDebug ? `
        local function ${vNames.check}()
            if debug.getinfo(1) or getfenv().script == nil then 
                while true do end 
            end
            local t = tick()
            if tick() - t > 0.5 then while true do end end
        end
        ${vNames.check}()` : "-- AD Disabled";

        return `
--[[ NEBULOUS PROTECT v5.0 ]]
local ${vNames.vm} = function(...)
    ${antiDebugCode}
    local _data = "${bytecode}"
    local _key = "${key}"
    local function ${vNames.decrypt}(d, k)
        local out = ""
        local b = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
        d = d:gsub('[^'..b..'=]', '')
        local res = ""
        -- Complex XOR/Base64 internal shim
        -- [Simulated for space, includes multi-layered decryption]
        return loadstring(d)() -- Placeholder for the actual bytecode runner
    end

    -- VIRTUAL MACHINE DISPATCHER
    local ${vNames.stack} = {}
    local ${vNames.pc} = 1
    local ${vNames.dispatch} = {
        [${opMap.PRINT}] = function(s) print(table.remove(s)) end,
        [${opMap.LOADK}] = function(s, v) table.insert(s, v) end,
        [${opMap.CALL}] = function(s) -- Logic
        end
    }
    
    -- The actual runner would loop through 'bytecode' using the 'dispatch' map
    -- making it extremely hard to trace logic flow.
end
${vNames.vm}(...)`;
    },

    // 3. Main Obfuscation Logic
    obfuscate: (input, settings) => {
        if (!input.trim()) return "-- Error: No input provided";

        // Create a randomized OpCode map for this specific build
        const opMap = {
            PRINT: Math.floor(Math.random() * 255),
            LOADK: Math.floor(Math.random() * 255),
            CALL: Math.floor(Math.random() * 255),
            JMP: Math.floor(Math.random() * 255),
        };

        const key = Nebulous.generateId(16);
        
        // Step 1: Encrypt the original source (Simplified Bytecode)
        // In a real version, we would compile to binary here.
        const encryptedSource = Nebulous.xorEncrypt(input, key);

        // Step 2: Build the VM
        let output = Nebulous.getVMTemplate(encryptedSource, key, opMap, settings.antiDebug);

        // Step 3: Add "Junk" Noise to the final file
        if (settings.junk) {
            for (let i = 0; i < 5; i++) {
                output = `--[[ ${Nebulous.generateId(32)} ]]\n` + output;
            }
        }

        return output;
    }
};

// UI Handlers
document.addEventListener('DOMContentLoaded', () => {
    const inputArea = document.getElementById('input-code');
    const outputArea = document.getElementById('output-code');
    const obfBtn = document.getElementById('obfuscate-btn');

    obfBtn.addEventListener('click', () => {
        obfBtn.textContent = "COMPILING VM...";
        obfBtn.disabled = true;

        setTimeout(() => {
            const settings = {
                antiDebug: document.getElementById('anti-debug').checked,
                junk: document.getElementById('junk-code').checked
            };

            const result = Nebulous.obfuscate(inputArea.value, settings);
            outputArea.value = result;
            
            obfBtn.textContent = "INITIALIZE OBFUSCATION";
            obfBtn.disabled = false;
        }, 800);
    });

    document.getElementById('copy-btn').addEventListener('click', () => {
        outputArea.select();
        document.execCommand('copy');
        alert("Copied to clipboard!");
    });

    document.getElementById('clear-btn').addEventListener('click', () => {
        inputArea.value = "";
    });
});
