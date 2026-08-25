"""
KS D 3502:2022 standard shapes (H, L, P, T, B, C) -> JSON, normalized into the
SAME record shape as the AISC data (name/edi/type/ks/us/mt with fields
d/bf/tw/tf/b/t/OD/tnom/Ht/B/A/W/Ix/Iy/rx/ry/Zx/Zy) so the existing React
components (ShapeDetail, SectionSVG, PropsTable) and the sectionSvg.js
renderer work unchanged. KS source tables are metric-only (mm/cm); the
'us' (imperial) side is derived by unit conversion, not re-tabulated.

Source: user-provided KS D 3502:2022 extract tables, tab-separated txt,
one file per shape family (source/ks/{H,L,P,T,B,C}.txt).
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "source" / "ks"
DATA_DIR = ROOT / "src" / "data"

MM_TO_IN = 1 / 25.4
MM2_TO_IN2 = 1 / 645.16
KGM_TO_LBFT = 0.671969
CM4_TO_MM4E6 = 0.01     # cm^4 -> (x10^6 mm^4) display unit
MM4E6_TO_IN4 = 1e6 / 416231.4256
CM3_TO_MM3E3 = 1.0       # cm^3 -> (x10^3 mm^3) display unit, numerically equal
MM3E3_TO_IN3 = 1000 / 16387.0642
CM_TO_MM = 10.0


def fnum(s):
    s = (s or "").strip()
    if s == "":
        return None
    return float(s)


def fmt(x, decimals=1):
    if x is None:
        return None
    r = round(x, decimals)
    if abs(r - round(r)) < 1e-9:
        return str(int(round(r)))
    s = f"{r:.{decimals}f}".rstrip("0").rstrip(".")
    return s


def read_rows(fname):
    path = SRC_DIR / fname
    with open(path, encoding="utf-8") as f:
        reader = list(csv.reader(f, delimiter="\t"))
    return reader[2:]  # skip header + units rows


def ks_norm(label, prefix):
    norm = label.replace("x", "×").replace("X", "×").strip()
    ascii_form = norm.replace("×", "X").replace(" ", "")
    if not norm.startswith(prefix):
        norm = f"{prefix}{norm}"
    if not ascii_form.startswith(prefix):
        ascii_form = f"{prefix}{ascii_form}"
    return norm, f"{prefix}-{ascii_form[len(prefix):]}"


def build_h():
    shapes = []
    for row in read_rows("H.txt"):
        if len(row) < 15 or not row[0].strip():
            continue
        label, lt, H, B, tw, tf, r, A, W, Ix, Iy, ix, iy, Zx, Zy = row[:15]
        name, _ = ks_norm(label, "H")
        d_mm, bf_mm, tw_mm, tf_mm, r_mm = fnum(H), fnum(B), fnum(tw), fnum(tf), fnum(r)
        ks = f"H-{fmt(d_mm)}X{fmt(bf_mm)}X{fmt(tw_mm)}X{fmt(tf_mm)}"
        A_mm2 = fnum(A) * 100 if fnum(A) is not None else None
        W_kgm = fnum(W)
        Ix_disp = fnum(Ix) * CM4_TO_MM4E6 if fnum(Ix) is not None else None
        Iy_disp = fnum(Iy) * CM4_TO_MM4E6 if fnum(Iy) is not None else None
        rx_mm = fnum(ix) * CM_TO_MM if fnum(ix) is not None else None
        ry_mm = fnum(iy) * CM_TO_MM if fnum(iy) is not None else None
        Zx_disp = fnum(Zx) * CM3_TO_MM3E3 if fnum(Zx) is not None else None
        Zy_disp = fnum(Zy) * CM3_TO_MM3E3 if fnum(Zy) is not None else None
        kdes_mm = (tf_mm + r_mm) if (tf_mm is not None and r_mm is not None) else None

        mt = {"d": fmt(d_mm), "bf": fmt(bf_mm), "tw": fmt(tw_mm), "tf": fmt(tf_mm),
              "r": fmt(r_mm), "A": fmt(A_mm2), "W": fmt(W_kgm, 2),
              "Ix": fmt(Ix_disp, 2), "Iy": fmt(Iy_disp, 2),
              "rx": fmt(rx_mm), "ry": fmt(ry_mm), "Zx": fmt(Zx_disp), "Zy": fmt(Zy_disp),
              "kdes": fmt(kdes_mm)}
        us = {
            "d": fmt(d_mm * MM_TO_IN, 2), "bf": fmt(bf_mm * MM_TO_IN, 2),
            "tw": fmt(tw_mm * MM_TO_IN, 3), "tf": fmt(tf_mm * MM_TO_IN, 3),
            "r": fmt(r_mm * MM_TO_IN, 3), "A": fmt(A_mm2 * MM2_TO_IN2, 2),
            "W": fmt(W_kgm * KGM_TO_LBFT, 1),
            "Ix": fmt(Ix_disp * MM4E6_TO_IN4, 1) if Ix_disp is not None else None,
            "Iy": fmt(Iy_disp * MM4E6_TO_IN4, 1) if Iy_disp is not None else None,
            "rx": fmt(rx_mm * MM_TO_IN, 2) if rx_mm is not None else None,
            "ry": fmt(ry_mm * MM_TO_IN, 2) if ry_mm is not None else None,
            "Zx": fmt(Zx_disp * MM3E3_TO_IN3, 1) if Zx_disp is not None else None,
            "Zy": fmt(Zy_disp * MM3E3_TO_IN3, 1) if Zy_disp is not None else None,
            "kdes": fmt(kdes_mm * MM_TO_IN, 3) if kdes_mm is not None else None,
        }
        shapes.append({"name": name, "edi": "", "type": "KSH", "ks": ks,
                        "note": "LT" if lt.strip() else "", "us": us, "mt": mt})
    return shapes


def build_l():
    shapes = []
    for row in read_rows("L.txt"):
        if not row or not row[0].strip():
            continue
        label, H, B, t1, t2, W, As = (row + [""] * 7)[:7]
        name, ks = ks_norm(label, "L")
        d_mm, b_mm, t1_mm, t2_mm = fnum(H), fnum(B), fnum(t1), fnum(t2)
        W_kgm, As_mm2 = fnum(W), fnum(As)
        mt = {"d": fmt(d_mm), "b": fmt(b_mm), "t": fmt(t1_mm), "t2": fmt(t2_mm),
              "W": fmt(W_kgm, 2), "A": fmt(As_mm2)}
        us = {"d": fmt(d_mm * MM_TO_IN, 3), "b": fmt(b_mm * MM_TO_IN, 3),
              "t": fmt(t1_mm * MM_TO_IN, 4), "t2": fmt(t2_mm * MM_TO_IN, 4),
              "W": fmt(W_kgm * KGM_TO_LBFT, 2), "A": fmt(As_mm2 * MM2_TO_IN2, 3)}
        shapes.append({"name": name, "edi": "", "type": "KSL", "ks": ks, "us": us, "mt": mt})
    return shapes


def build_p():
    shapes = []
    for row in read_rows("P.txt"):
        if not row or not row[0].strip():
            continue
        label, D, t, W, As = (row + [""] * 5)[:5]
        name, ks = ks_norm(label, "P")
        od_mm, t_mm = fnum(D), fnum(t)
        W_kgm, As_mm2 = fnum(W), fnum(As)
        mt = {"OD": fmt(od_mm, 1), "tnom": fmt(t_mm, 2), "tdes": fmt(t_mm, 2),
              "W": fmt(W_kgm, 2), "A": fmt(As_mm2)}
        us = {"OD": fmt(od_mm * MM_TO_IN, 3), "tnom": fmt(t_mm * MM_TO_IN, 4),
              "tdes": fmt(t_mm * MM_TO_IN, 4),
              "W": fmt(W_kgm * KGM_TO_LBFT, 2), "A": fmt(As_mm2 * MM2_TO_IN2, 3)}
        shapes.append({"name": name, "edi": "", "type": "KSP", "ks": ks, "us": us, "mt": mt})
    return shapes


def build_t():
    shapes = []
    for row in read_rows("T.txt"):
        if not row or not row[0].strip():
            continue
        label, H, B, tw, tf, W, As = (row + [""] * 7)[:7]
        name, ks = ks_norm(label, "T")
        d_mm, bf_mm, tw_mm, tf_mm = fnum(H), fnum(B), fnum(tw), fnum(tf)
        W_kgm, As_mm2 = fnum(W), fnum(As)
        mt = {"d": fmt(d_mm), "bf": fmt(bf_mm), "tw": fmt(tw_mm), "tf": fmt(tf_mm),
              "W": fmt(W_kgm, 2), "A": fmt(As_mm2)}
        us = {"d": fmt(d_mm * MM_TO_IN, 3), "bf": fmt(bf_mm * MM_TO_IN, 3),
              "tw": fmt(tw_mm * MM_TO_IN, 4), "tf": fmt(tf_mm * MM_TO_IN, 4),
              "W": fmt(W_kgm * KGM_TO_LBFT, 2), "A": fmt(As_mm2 * MM2_TO_IN2, 3)}
        shapes.append({"name": name, "edi": "", "type": "KST", "ks": ks, "us": us, "mt": mt})
    return shapes


def build_b():
    shapes = []
    for row in read_rows("B.txt"):
        if not row or not row[0].strip():
            continue
        label, H, B, TW, TF, W, As = (row + [""] * 7)[:7]
        name, ks = ks_norm(label, "B")
        h_mm, b_mm, t_mm = fnum(H), fnum(B), fnum(TW)
        W_kgm, As_mm2 = fnum(W), fnum(As)
        mt = {"Ht": fmt(h_mm), "B": fmt(b_mm), "tnom": fmt(t_mm, 2), "tdes": fmt(t_mm, 2),
              "W": fmt(W_kgm, 2), "A": fmt(As_mm2)}
        us = {"Ht": fmt(h_mm * MM_TO_IN, 3), "B": fmt(b_mm * MM_TO_IN, 3),
              "tnom": fmt(t_mm * MM_TO_IN, 4), "tdes": fmt(t_mm * MM_TO_IN, 4),
              "W": fmt(W_kgm * KGM_TO_LBFT, 2), "A": fmt(As_mm2 * MM2_TO_IN2, 3)}
        shapes.append({"name": name, "edi": "", "type": "KSB", "ks": ks, "us": us, "mt": mt})
    return shapes


def build_c():
    shapes = []
    for row in read_rows("C.txt"):
        if not row or not row[0].strip():
            continue
        label, H, B, tw, tf, r1, r2, As, W = (row + [""] * 9)[:9]
        name, ks = ks_norm(label, "C")
        d_mm, bf_mm, tw_mm, tf_mm = fnum(H), fnum(B), fnum(tw), fnum(tf)
        W_kgm, As_mm2 = fnum(W), fnum(As)
        mt = {"d": fmt(d_mm), "bf": fmt(bf_mm), "tw": fmt(tw_mm), "tf": fmt(tf_mm),
              "W": fmt(W_kgm, 2), "A": fmt(As_mm2)}
        us = {"d": fmt(d_mm * MM_TO_IN, 3), "bf": fmt(bf_mm * MM_TO_IN, 3),
              "tw": fmt(tw_mm * MM_TO_IN, 4), "tf": fmt(tf_mm * MM_TO_IN, 4),
              "W": fmt(W_kgm * KGM_TO_LBFT, 2), "A": fmt(As_mm2 * MM2_TO_IN2, 3)}
        shapes.append({"name": name, "edi": "", "type": "KSC", "ks": ks, "us": us, "mt": mt})
    return shapes


def main():
    builders = {
        "ksh": build_h(), "ksl": build_l(), "ksp": build_p(),
        "kst": build_t(), "ksb": build_b(), "ksc": build_c(),
    }
    ks_index = []
    for fname, shapes in builders.items():
        with open(DATA_DIR / f"{fname}.json", "w", encoding="utf-8") as f:
            json.dump(shapes, f, ensure_ascii=False)
        print(f"  {fname}: {len(shapes)} shapes")
        ks_index.extend({"name": s["name"], "edi": s["edi"], "ks": s["ks"], "type": s["type"]} for s in shapes)

    with open(DATA_DIR / "ks_index.json", "w", encoding="utf-8") as f:
        json.dump(ks_index, f, ensure_ascii=False)
    print(f"  ks_index.json: {len(ks_index)} entries")


if __name__ == "__main__":
    main()
