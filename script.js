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
    bytes.push(code.charCodeAt(i) ^ key);
  }

  let indexed = bytes.map((v, i) => ({ i: i + 1, v }));
  indexed = shuffleArray(indexed);

  const indexList = indexed.map(o => o.i).join(",");
  const valueList = indexed.map(o => o.v).join(",");

  const d = "_d" + randomInt(1000, 9999);
  const v = "_v" + randomInt(1000, 9999);
  const k = "_k" + randomInt(1000, 9999);
  const t = "_t" + randomInt(1000, 9999);
  const s = "_s" + randomInt(1000, 9999);
  const f = "_f" + randomInt(1000, 9999);
  const fakeD = "_fd" + randomInt(1000, 9999);
  const fakeV = "_fv" + randomInt(1000, 9999);

  const fakeDList = Array.from({ length: 8 }, () => randomInt(1, code.length + 20)).join(",");
  const fakeVList = Array.from({ length: 8 }, () => randomInt(50, 255)).join(",");

  return `
local bit = bit32 or bit
local ${k} = ${key}
local ${d} = {${indexList}}
local ${v} = {${valueList}}
local ${t} = {}

if #${d} == 0 or #${d} ~= #${v} then
    error("corrupted chunk")
end

for n = 1, #${d} do
    local pos = ${d}[n]
    local val = ${v}[n]
    ${t}[pos] = string.char(bit.bxor(val, ${k}))
end

local ${s} = table.concat(${t})

if #${s} < 5 then
    error("invalid chunk")
end

local ${fakeD} = {${fakeDList}}
local ${fakeV} = {${fakeVList}}
pcall(function()
    local _x = {}
    for i = 1, #${fakeD} do
        _x[i] = string.char(bit.bxor(${fakeV}[i], ${key} + 1))
    end
end)

local ${f}, err = loadstring(${s})
if not ${f} then
    return error("obfuscated chunk error: "..tostring(err))
end

return ${f}()
`;
}

// فك تشفير محسّن (يقرأ المتغيرات الحقيقية بالاسم)
function testDecrypt(obf) {
  // key
  const keyMatch = obf.match(/local\s+([_%w]+)\s*=\s*(\d+)/);
  if (!keyMatch) return "Key not found";
  const key = Number(keyMatch[2]);

  // d و v
  const arrayMatches = [...obf.matchAll(/local\s+([_%w]+)\s*=\s*\{([0-9,\s]+)\}/g)];
  if (arrayMatches.length < 2) return "Arrays not found";

  const dArr = arrayMatches[0][2].split(",").map(n => Number(n.trim()));
  const vArr = arrayMatches[1][2].split(",").map(n => Number(n.trim()));

  if (dArr.length !== vArr.length || dArr.length === 0) return "Invalid data";

  let tmp = [];
  for (let i = 0; i < dArr.length; i++) {
    const pos = dArr[i];
    const val = vArr[i];
    tmp[pos - 1] = String.fromCharCode(val ^ key);
  }
  return tmp.join("");
}

document.getElementById("obfuscateBtn").addEventListener("click", () => {
  const input = document.getElementById("input").value;
  document.getElementById("output").value = obfuscateLuauStrong(input);
});

document.getElementById("decryptBtn").addEventListener("click", () => {
  const input = document.getElementById("input").value;
  document.getElementById("output").value = testDecrypt(input);
});

document.getElementById("copyBtn").addEventListener("click", () => {
  navigator.clipboard.writeText(document.getElementById("output").value);
});

const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");

menuBtn.addEventListener("click", () => {
  sideMenu.classList.toggle("open");
});

document.querySelectorAll(".menu-item").forEach(btn => {
  btn.addEventListener("click", () => {
    const page = btn.getAttribute("data-page");

    if (page === "encrypt") {
      document.querySelector("h1").innerText = "Luau Obfuscator";
      document.getElementById("input").placeholder = "Paste your Luau code here";
      document.getElementById("output").placeholder = "Obfuscated code will appear here";
    }

    if (page === "decrypt") {
      document.querySelector("h1").innerText = "Decrypt Tester";
      document.getElementById("input").placeholder = "Paste obfuscated code here";
      document.getElementById("output").placeholder = "Decrypted result will appear here";
    }

    sideMenu.classList.remove("open");
  });
});
