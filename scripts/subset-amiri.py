"""
Rebuilds app/fonts/amiri-quran.woff2: Amiri Regular subset to exactly the characters the site
renders in it (the Tanzil Uthmani text, surah names, the ayah-end mark and Arabic-Indic digits),
keeping every OpenType layout feature so shaping and mark positioning are unchanged.
42 KB instead of Google Fonts' 105 KB Arabic subset.

Amiri is OFL-1.1 with no Reserved Font Name, so a subset may keep the name; the licence ships
alongside (app/fonts/Amiri-OFL.txt). Verified at creation: all 6,348 lines (ayahs + basmalas)
shape to identical geometry, and sampled lines render pixel-identical, against the full font.

Run: pip3 install fonttools brotli && python3 scripts/subset-amiri.py
"""
import json, re, subprocess, sys, tempfile, urllib.request
from pathlib import Path

root = Path(__file__).resolve().parent.parent
src = (root / "data/quran/source/quran-uthmani.txt").read_text(encoding="utf8")
text = "".join(l.split("|", 2)[2] for l in src.split("\n") if re.match(r"^\d+\|", l))
names = "".join(s["arabic"] for s in json.loads((root / "data/quran/surahs.json").read_text())["surahs"])
cps = sorted({ord(c) for c in text + names} | {0x06DD, 0x20, 0xA0} | set(range(0x0660, 0x066A)))

with tempfile.TemporaryDirectory() as tmp:
    ttf = Path(tmp) / "Amiri-Regular.ttf"
    urllib.request.urlretrieve("https://github.com/google/fonts/raw/main/ofl/amiri/Amiri-Regular.ttf", ttf)
    subprocess.run([sys.executable, "-m", "fontTools.subset", str(ttf),
                    "--unicodes=" + ",".join(f"U+{c:04X}" for c in cps),
                    "--layout-features=*", "--flavor=woff2",
                    "--output-file=" + str(root / "app/fonts/amiri-quran.woff2")], check=True)
print(f"Wrote app/fonts/amiri-quran.woff2 ({len(cps)} codepoints)")
