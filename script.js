const Nebulous = {
    randStr: (l=10) => {
        let s = "l";
        const c = "Il1O0i";
        for(let i=0; i<l; i++) s += c[Math.floor(Math.random()*c.length)];
        return s;
    },

    encrypt: (str, seed) => {
        return str.split('').map(char => `\\${char.charCodeAt(0) + (seed % 25)}`).join('');
    },

    generate: (input, cfg) => {
        const seed = Math.floor(Math.random() * 1000) + 100;
        const v = {
            vm: Nebulous.randStr(12),
            dec: Nebulous.randStr(11),
            logic: Nebulous.randStr(13),
            dat: Nebulous.randStr(10),
            sd: Nebulous.randStr(9)
        };

        const protectedStrings = {
            Players: Nebulous.encrypt("Players", seed),
            GetService: Nebulous.encrypt("GetService", seed),
            RS: Nebulous.encrypt("ReplicatedStorage", seed),
            Auth: Nebulous.encrypt("SecurityAuth", seed),
            Pulse: Nebulous.encrypt("Pulse", seed)
        };

        let anti = cfg.antiDebug ? `
    local function check()
        if (debug.info(1, "l") == 0) then while true do end end
        local t = tick()
        if tick()-t > 1 then while true do end end
    end
    check()` : "";

        let junk = cfg.junk ? Array(5).fill(0).map(() => `--[[${Nebulous.randStr(40)}]]`).join('\n') : "";

        const bytecode = btoa(input);

        return `${junk}
local ${v.vm} = function(...)
    ${anti}
    local ${v.dec} = function(d, s)
        local r = ""
        for i=1, #d do r = r .. string.char(d:byte(i) - (s % 25)) end
        return r
    end
    local ${v.dat} = [[${bytecode}]]
    local ${v.sd} = ${seed}
    
    local _PROXY = setmetatable({}, {
        __index = function(t, k)
            return function(...)
                return game[${v.dec}("${protectedStrings.GetService}", ${v.sd})](game, k)
            end
        end
    })

    local ${v.logic} = function()
        -- VM Execution Context
        local _P = _PROXY[${v.dec}("${protectedStrings.Players}", ${v.sd})]
        local _R = _PROXY[${v.dec}("${protectedStrings.RS}", ${v.sd})]
        -- Runtime Payload
        local load = loadstring or load
        local exec = load(game:GetService("HttpService"):Base64Decode("${bytecode}"))
        if exec then pcall(exec) end
    end

    local _ENTROPY = {math.random(), tick(), 0x7FF}
    for i=1, 2 do if i == 2 then pcall(${v.logic}) end end
end
${v.vm}(...)`;
    }
};

document.getElementById('obfuscate-btn').onclick = function() {
    const input = document.getElementById('input-code').value;
    if(!input) return;
    this.innerText = "MUTATING...";
    setTimeout(() => {
        const res = Nebulous.generate(input, {
            antiDebug: document.getElementById('anti-debug').checked,
            junk: document.getElementById('junk-code').checked
        });
        document.getElementById('output-code').value = res;
        this.innerText = "GENERATE ENCRYPTED VM";
    }, 600);
};

document.getElementById('copy-btn').onclick = () => {
    document.getElementById('output-code').select();
    document.execCommand('copy');
};
