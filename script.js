// script.js
document.addEventListener("DOMContentLoaded", ()=>{

  const input = document.getElementById("input");
  const output = document.getElementById("output");
  const obfBtn = document.getElementById("obfBtn");
  const copyBtn = document.getElementById("copyBtn");
  const clearBtn = document.getElementById("clearBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const themeToggle = document.getElementById("themeToggle");
  const modeSelect = document.getElementById("modeSelect");

  const deobInput = document.getElementById("deobInput");
  const deobOutput = document.getElementById("deobOutput");
  const tryDeobBtn = document.getElementById("tryDeobBtn");
  const clearDeobBtn = document.getElementById("clearDeobBtn");

  // theme
  function setTheme(isLight){
    if(isLight) document.body.classList.add("light");
    else document.body.classList.remove("light");
    themeToggle.textContent = isLight ? "Light" : "Dark";
  }
  themeToggle.addEventListener("click", ()=>{
    const isLight = !document.body.classList.contains("light");
    setTheme(isLight);
  });
  setTheme(false);

  // clear
  clearBtn.addEventListener("click", ()=>{ input.value = ""; output.value = ""; });

  // obfuscate
  obfBtn.addEventListener("click", ()=>{
    let code = input.value;
    if(!code.trim()){ alert("حط سكربتك أول"); return; }
    // mode can be used to tune layers later
    let mode = modeSelect.value;
    // call obfuscator
    try{
      let res = Obf.process(code, mode);
      output.value = res;
    }catch(e){
      output.value = "-- Error during obfuscation: " + e.message;
    }
  });

  // copy
  copyBtn.addEventListener("click", ()=>{
    output.select();
    document.execCommand("copy");
  });

  // download
  downloadBtn.addEventListener("click", ()=>{
    const blob = new Blob([output.value], {type:"text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "obfuscated.lua";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // deobfuscate attempt
  tryDeobBtn.addEventListener("click", ()=>{
    const payload = deobInput.value;
    if(!payload.trim()){ alert("حط سكربت مشفّر"); return; }
    const res = Obf.tryDeobfuscate(payload);
    if(res) deobOutput.value = res;
    else deobOutput.value = "-- لم يتم العثور على جدول تشفير مباشر أو المفتاح";
  });

  clearDeobBtn.addEventListener("click", ()=>{ deobInput.value=""; deobOutput.value=""; });

});
