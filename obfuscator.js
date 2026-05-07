// obfuscator.js
// طبقات: minify -> rename locals -> string encrypt -> junk inject -> packer

(function(global){
  // توليد مفتاح عشوائي 1..255
  function randKey(){ return Math.floor(Math.random()*254)+1; }

  // إزالة تعليقات ومساحات زائدة
  function minifyLua(code){
    // remove block comments --[[ ... ]]
    code = code.replace(/--

\[

\[[\s\S]*?\]

\]

/g, "");
    // remove line comments
    code = code.replace(/--[^\n\r]*/g, "");
    // collapse multiple spaces and newlines
    code = code.replace(/[ \t]+/g, " ");
    code = code.replace(/\r\n/g, "\n");
    code = code.replace(/\n{2,}/g, "\n");
    return code.trim();
  }

  // rename local variables (simple heuristic)
  function renameLocals(code){
    // find local declarations
    let map = {};
    let counter = 0;
    code = code.replace(/\blocal\s+([A-Za-z_][A-Za-z0-9_]*)/g, function(m, name){
      if(!map[name]){
        counter++;
        map[name] = "__z" + counter + "_" + Math.floor(Math.random()*9000+1000);
      }
      return "local " + map[name];
    });
    // replace usages (naive, may replace substrings inside other names; acceptable for obfuscator POC)
    for(let old in map){
      let re = new RegExp("([^A-Za-z0-9_])"+old+"([^A-Za-z0-9_])","g");
      code = code.replace(re, "$1"+map[old]+"$2");
    }
    return code;
  }

  // encode string with XOR key and return escaped numeric sequence like \65\66...
  function encodeString(s, key){
    let out = [];
    for(let i=0;i<s.length;i++){
      let c = s.charCodeAt(i) ^ key;
      out.push("\\" + c);
    }
    return out.join("");
  }

  // replace literal strings "..." and '...' with decoder calls
  function encryptStrings(code, keyName){
    // capture both "..." and '...' and long bracket strings
    let key = randKey();
    // store encoded strings
    let encoded = [];
    let idx = 0;
    code = code.replace(/(

\[=*

\[[\s\S]*?\]

=*\]

)|("([^"\\]

|\\.)*")|('([^'\\]

|\\.)*')/g, function(m){
      // skip if it's a long bracket string (we still encode it)
      let raw = m;
      // strip quotes for " and '
      if((raw[0]==='"' && raw[raw.length-1]==='"') || (raw[0]==="'" && raw[raw.length-1]==="'")){
        raw = raw.slice(1,-1);
      } else {
        // long bracket, remove surrounding brackets
        raw = raw.replace(/^

\[=*

\[/,"").replace(/\]

=*\]

$/,"");
      }
      idx++;
      let enc = encodeString(raw, key);
      encoded.push(enc);
      return "__DECODE(" + idx + ")";
    });
    // build decoder table and function
    let tableParts = encoded.map((e,i)=>`["${i+1}"]="${e}"`).join(",");
    let decoder = `
local __KEY = ${key}
local __ENC = { ${encoded.map((e,i)=>`"${e}"`).join(",")} }
local function __DECODE(i)
  local s = __ENC[i]
  local out = {}
  for num in s:gmatch("\\\\(%d+)") do
    out[#out+1] = string.char(tonumber(num) ~ __KEY)
  end
  return table.concat(out)
end
`;
    return {code: decoder + "\n" + code, key:key};
  }

  // inject junk snippets randomly
  function injectJunk(code){
    const junkPool = [
      "do local _x=0 for i=1,5 do _x=_x+i end end",
      "if false then print('x') end",
      "local __tmp = function() return nil end",
      "repeat local a=1; a=a+1; until a>1",
      "local _junk = {1,2,3,4,5}; table.remove(_junk,1)"
    ];
    // insert a few junk blocks at top and bottom
    let top = junkPool[Math.floor(Math.random()*junkPool.length)];
    let bottom = junkPool[Math.floor(Math.random()*junkPool.length)];
    return top + "\n" + code + "\n" + bottom;
  }

  // packer: wrap code into loader that decodes strings and executes
  function pack(code){
    // compress newlines to keep output compact
    code = code.replace(/\n+/g, "\\n");
    // escape quotes
    code = code.replace(/\\/g,"\\\\").replace(/"/g,'\\"');
    let loader = `
local function __run()
  local s = "${code}"
  s = s:gsub("\\\\n","\\n")
  loadstring(s)()
end
__run()
`;
    return loader;
  }

  // full pipeline
  function process(code, mode){
    // 1. minify
    code = minifyLua(code);

    // 2. rename locals
    code = renameLocals(code);

    // 3. inject junk
    code = injectJunk(code);

    // 4. encrypt strings
    let enc = encryptStrings(code);
    code = enc.code;

    // 5. final pack
    let final = pack(code);

    // 6. add small anti-debug trap (simple)
    let anti = "pcall(function() if debug and debug.getinfo then local i=debug.getinfo(1) end end)";

    return anti + "\n" + final;
  }

  // simple deobfuscator attempt: tries to extract encoded table and decode with brute force key 1..255
  function tryDeobfuscate(payload){
    // naive: look for __ENC table string entries and __KEY value
    // if __KEY present, decode directly
    let keyMatch = payload.match(/local __KEY = (\\d+)/);
    if(keyMatch){
      let key = parseInt(keyMatch[1],10);
      let encMatches = payload.match(/local __ENC = \\{\\s*([^\\}]*)\\s*\\}/);
      if(encMatches){
        let entries = encMatches[1].match(/"([^"]*)"/g) || [];
        let decoded = entries.map(s=>{
          s = s.slice(1,-1);
          let out = "";
          let m;
          let re = /\\\\(\\d+)/g;
          while((m = re.exec(s)) !== null){
            out += String.fromCharCode(parseInt(m[1],10) ^ key);
          }
          return out;
        });
        // replace __DECODE(i) occurrences
        let result = payload.replace(/__DECODE\\((\\d+)\\)/g, function(_,n){
          return '"' + decoded[parseInt(n,10)-1].replace(/"/g,'\\"') + '"';
        });
        return result;
      }
    }
    return null;
  }

  // export
  global.Obf = {
    process: process,
    tryDeobfuscate: tryDeobfuscate
  };

})(window);
