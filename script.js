function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function obfuscateLuauStrong(code) {
  const key = randomInt(5, 200);

  let bytes = [];
  for (let i = 0; i < code.length; i++) {
    const c = code.charCodeAt(i);
    bytes.push(c ^ key);
  }

  let indexed = bytes.map((v, i) => ({ i: i + 1, v }));
  indexed = shuffleArray(indexed);

  const indexList = indexed.map(o => o.i).join(",");
  const valueList = indexed.map(o => o.v).join(",");

  const varDataIdx = "_d" + randomInt(1000, 9999);
  const varDataVal = "_v" + randomInt(1000, 9999);
  const varKey = "_k" + randomInt(1000, 9999);
  const varTmp = "_t" + randomInt(1000, 9999);
  const varSrc = "_s" + randomInt(1000, 9999);
  const varFn = "_f" + randomInt(1000, 9999);

  const loader = `
local bit = bit32 or bit
local ${varKey} = ${key}
local ${varDataIdx} = {${indexList}}
local ${varDataVal} = {${valueList}}
local ${varTmp} = {}
for n = 1, #${varDataIdx} do
    local pos = ${varDataIdx}[n]
    local val = ${varDataVal}[n]
    ${varTmp}[pos] = string.char(bit.bxor(val, ${varKey}))
end
local ${varSrc} = table.concat(${varTmp})
local ${varFn}, err = loadstring(${varSrc})
if not ${varFn} then
    return error("obfuscated chunk error: "..tostring(err))
end
do
    local junk = {1,2,3,4,5}
    for i = 1, #junk do
        junk[i] = junk[i] * (i + ${key})
    end
end
return ${varFn}()
`;

  return loader;
}

document.getElementById("obfuscateBtn").addEventListener("click", () => {
  const input = document.getElementById("input").value;
  if (!input.trim()) {
    alert("اكتب كود Luau أول.");
    return;
  }
  const obfuscated = obfuscateLuauStrong(input);
  document.getElementById("output").value = obfuscated;
});

document.getElementById("copyBtn").addEventListener("click", () => {
  const out = document.getElementById("output");
  if (!out.value.trim()) {
    alert("ما فيه ناتج لسه.");
    return;
  }
  out.select();
  out.setSelectionRange(0, 999999);
  navigator.clipboard.writeText(out.value).then(() => {
    alert("تم النسخ ✅");
  }).catch(() => {
    alert("ما قدر ينسخ، انسخ يدوي.");
  });
});
