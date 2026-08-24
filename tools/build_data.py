"""
AISC Shapes Database v16.0 (xlsx) -> JSON for the section_database web app.

Reads source/aisc-shapes-database-v160-2.xlsx, sheet "Database v16.0",
and produces:
  src/data/index.json        lightweight search index (all 2,299 shapes)
  src/data/defs.json         symbol -> description
  src/data/{type}.json       one file per AISC Type (13 files), lazy-loaded
  src/data/rebar.json        static rebar table (link 7, confirmed)
  src/data/purlin.json       placeholder (link 5 PDF not machine-readable)
  src/data/metaldeck.json    placeholder (link 6, profile names only)

KS 호칭 규칙은 PLAN_1.md 5절을 따른다:
  - AISC SI(mm) 표의 값을 그대로 사용 (재계산 없음), 소수 1자리까지.
  - 예외: 원형 단면(PIPE, 원형 HSS)의 OD는 in x 25.4 정확값을 사용.
  - Type 접두는 AISC Type을 그대로 유지, HSS/PIPE 두께는 tnom 사용.
  - 2L은 AISC_Manual_Label의 4번째 X-분절(SLBB/LLBB 간격)을 갭으로 파싱.
"""
import json
import re
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
SRC_XLSX = ROOT / "source" / "aisc-shapes-database-v160-2.xlsx"
DATA_DIR = ROOT / "src" / "data"

TYPE_ORDER = ["W", "M", "S", "HP", "WT", "MT", "ST", "HSS", "PIPE", "L", "2L", "C", "MC"]


def fmt_num(v):
    """Format an xlsx numeric cell as a display string; None for blanks/dashes."""
    if v is None:
        return None
    if isinstance(v, str):
        s = v.strip()
        if s == "" or s in ("–", "-", "—"):
            return None
        return s
    if isinstance(v, (int, float)):
        f = float(v)
        if abs(f - round(f)) < 1e-9:
            return str(int(round(f)))
        r1 = round(f, 1)
        if abs(f - r1) < 1e-9:
            s = f"{r1:.1f}".rstrip("0").rstrip(".")
            return s if s else "0"
        return str(round(f, 3))
    return str(v)


def to_float(v):
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip()
    if s == "" or s in ("–", "-", "—"):
        return None
    try:
        return float(s)
    except ValueError:
        return None


FRACTION_RE = re.compile(r"^(?:(\d+)-)?(\d+)/(\d+)$")


def parse_fraction_inches(token):
    """'1-3/8' -> 1.375, '3/4' -> 0.75, '1' -> 1.0"""
    token = token.strip()
    m = FRACTION_RE.match(token)
    if m:
        whole = int(m.group(1)) if m.group(1) else 0
        return whole + int(m.group(2)) / int(m.group(3))
    try:
        return float(token)
    except ValueError:
        return None


def fmt_mm(x, decimals=1):
    if x is None:
        return None
    r = round(x, decimals)
    if abs(r - round(r)) < 1e-9:
        return str(int(round(r)))
    s = f"{r:.{decimals}f}".rstrip("0").rstrip(".")
    return s


def ks_label(shape):
    """Build the KS-style designation per PLAN_1.md section 5."""
    t = shape["type"]
    mt = shape["mt"]
    us = shape["us"]

    def g(field):
        v = mt.get(field)
        return to_float(v) if v is not None else None

    if t in ("W", "M", "S", "HP", "WT", "MT", "ST", "C", "MC"):
        d, bf, tw, tf = g("d"), g("bf"), g("tw"), g("tf")
        if None in (d, bf, tw, tf):
            return None
        return f"{t}-{fmt_mm(d)}X{fmt_mm(bf)}X{fmt_mm(tw)}X{fmt_mm(tf)}"

    if t == "L":
        d, b, th = g("d"), g("b"), g("t")
        if None in (d, b, th):
            return None
        return f"L-{fmt_mm(d)}X{fmt_mm(b)}X{fmt_mm(th)}"

    if t == "2L":
        d, b, th = g("d"), g("b"), g("t")
        if None in (d, b, th):
            return None
        gap_in = shape.pop("_gap_in", 0.0)
        gap_mm = fmt_mm(gap_in * 25.4, decimals=0)
        return f"2L-{fmt_mm(d)}X{fmt_mm(b)}X{fmt_mm(th)} (갭{gap_mm})"

    if t == "HSS":
        ht, b = g("Ht"), g("B")
        tnom = g("tnom")
        if ht is not None and b is not None and tnom is not None:
            return f"□-{fmt_mm(ht)}X{fmt_mm(b)}X{fmt_mm(tnom)}"
        od_in = to_float(us.get("OD"))
        tnom_v = g("tnom")
        if od_in is not None and tnom_v is not None:
            return f"Ø-{fmt_mm(od_in * 25.4)}X{fmt_mm(tnom_v)}"
        return None

    if t == "PIPE":
        od_in = to_float(us.get("OD"))
        tnom_v = g("tnom")
        if od_in is None or tnom_v is None:
            return None
        return f"Ø-{fmt_mm(od_in * 25.4)}X{fmt_mm(tnom_v)}"

    return None


def build_shapes():
    wb = openpyxl.load_workbook(SRC_XLSX, read_only=True, data_only=True)
    ws = wb["Database v16.0"]
    rows = ws.iter_rows(values_only=True)
    header = next(rows)

    us_fields = header[4:84]   # W..WGo (skip Type, EDI, Label, T_F)
    si_fields = header[86:166]  # W..WGo (skip EDI, Label duplicated at 84,85)

    shapes = []
    for row in rows:
        rtype = row[0]
        if not rtype:
            continue
        edi, label, tf_note = row[1], row[2], row[3]

        us = {}
        for i, fname in enumerate(us_fields, start=4):
            val = fmt_num(row[i])
            if val is not None:
                us[fname] = val

        mt = {}
        for i, fname in enumerate(si_fields, start=86):
            val = fmt_num(row[i])
            if val is not None:
                mt[fname] = val

        shape = {
            "name": label,
            "edi": edi,
            "type": rtype,
            "tf_note": tf_note,
            "us": us,
            "mt": mt,
        }

        if rtype == "2L":
            # Manual label: 2L{d}X{d}X{t}[X{gap}]  e.g. 2L12X12X1-3/8X3/4
            parts = label[2:].split("X")
            gap_in = 0.0
            if len(parts) >= 4:
                g = parse_fraction_inches(parts[3])
                if g is not None:
                    gap_in = g
            shape["_gap_in"] = gap_in

        shape["ks"] = ks_label(shape)
        shapes.append(shape)

    return shapes


def main():
    shapes = build_shapes()
    print(f"Parsed {len(shapes)} shapes")

    by_type = {}
    for s in shapes:
        by_type.setdefault(s["type"], []).append(s)

    for t in TYPE_ORDER:
        rows = by_type.get(t, [])
        fname = t.lower() if t != "2L" else "2l"
        with open(DATA_DIR / f"{fname}.json", "w", encoding="utf-8") as f:
            json.dump(rows, f, ensure_ascii=False)
        print(f"  {t}: {len(rows)} -> {fname}.json")

    index = [
        {"name": s["name"], "edi": s["edi"], "ks": s["ks"], "type": s["type"]}
        for s in shapes
    ]
    with open(DATA_DIR / "index.json", "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False)
    print(f"  index.json: {len(index)} entries")

    # ---- defs.json -------------------------------------------------------
    readme = wb_readme_defs()
    with open(DATA_DIR / "defs.json", "w", encoding="utf-8") as f:
        json.dump(readme, f, ensure_ascii=False)
    print(f"  defs.json: {len(readme)} symbols")


def wb_readme_defs():
    """Symbol descriptions, ported from the prototype's DEFS table (link 1)."""
    proto = ROOT.parent / "aisc-section-finder-prototype.html"
    text = proto.read_text(encoding="utf-8")
    m = re.search(r"const DEFS = (\{.*?\});", text)
    if not m:
        return {}
    return json.loads(m.group(1))


if __name__ == "__main__":
    main()
