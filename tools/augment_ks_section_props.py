"""
Add geometrically-computed section properties to the KS shape JSON files
IN PLACE, without touching any existing field.

Why in place rather than re-running build_ks_data.py: source/ks/H.txt has
drifted from src/data/ksh.json since the KS data was first generated (2
shapes now missing, several tw values corrected) - re-running the H.txt
pipeline would silently drop/rename shapes unrelated to this task. Reading
back each shape's own already-published d/bf/tw/tf (and, for KSH, its own
already-published Ix/Iy) avoids that risk entirely, and also automatically
carries forward fields this script doesn't know about (dongkuk.available,
note, etc).

Scope (see PLAN discussion, review item 2):
  KSH  - adds k1/kdet/T (fillet-derived, same k=tf+r approximation kdes
         already used) and J/Cw/rts/ho (open-section/no-fillet torsion+LTB,
         same formulas manualHProps() in compose.js uses for a doubly-
         symmetric welded H). Ix/Iy/rx/ry/Zx/Zy are left untouched (real
         KS D 3502 appendix values). Workable gage (WGi/WGo) is
         deliberately NOT added - AISC's is a lookup table, not a formula,
         and there's no KS-side source for it yet; guessing would be worse
         than omitting.
  KSC  - adds Ix/Iy/Sx/Sy/Zx/Zy/rx/ry/x (channel, open on one side -
         Ix/Zx use the same width-per-y-band formula as an I-beam since
         that only depends on width(y), not x-position; Iy/x/Sy use the
         standard rect-minus-notch parallel-axis method; Zy reuses the
         general plastic-modulus solver with x and y swapped).
  KST  - adds Ix/Iy/Sx/Zx/Zy/rx/ry/y/J (tee - same flange+stem
         decomposition as manualTProps() in compose.js).
  KSP  - adds Ix/Iy/Sx/Sy/Zx/Zy/rx/ry/J/C (round tube - exact closed-form
         annulus formulas, not an approximation).
  KSB  - adds Ix/Iy/Sx/Sy/Zx/Zy/rx/ry/J (square/rect tube - sharp-corner,
         no fillet-radius correction, since the source table carries no
         corner radius; J via the Bredt thin-wall closed-section formula).
  KSL  - intentionally skipped (see PLAN: unequal-leg angle principal-axis
         properties need a different derivation, out of this pass).

All of the above are GEOMETRIC calculations, not transcribed from a KS
appendix (only H's Ix/Iy/Zx/Zy are a real published table - see
build_ks_data.py's docstring) - PropsTable's data-source note is worded
accordingly for these types.
"""
import json
import math
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "src" / "data"

MM_TO_IN = 1 / 25.4
MM3_TO_IN3 = 1 / 16387.064
MM4_TO_IN4 = 1 / 416231.4256
MM6_TO_IN6 = 1 / (25.4 ** 6)


def fmt(x, decimals=2):
    if x is None:
        return None
    r = round(x, decimals)
    if abs(r - round(r)) < 1e-9:
        return str(int(round(r)))
    s = f"{r:.{decimals}f}".rstrip("0").rstrip(".")
    return s


def fnum(v):
    return float(v) if v not in (None, "") else None


def plastic_modulus(rects):
    """rects: list of (yBot, yTop, width). General equal-area-axis plastic
    modulus solver - direct port of plasticModulusX() in
    src/components/builtup/compose.js (already verified there against
    brute-force numerical integration)."""
    total_area = sum(w * (yt - yb) for yb, yt, w in rects)
    if not (total_area > 0):
        return None
    half_area = total_area / 2
    sorted_rects = sorted(rects, key=lambda r: r[0])

    area_below = 0.0
    pna = sorted_rects[-1][1]
    for yb, yt, w in sorted_rects:
        r_area = w * (yt - yb)
        if area_below + r_area >= half_area:
            pna = yb + (half_area - area_below) / w
            break
        area_below += r_area

    z = 0.0
    for yb, yt, w in sorted_rects:
        pieces = [(yb, yt, w)] if (yt <= pna or yb >= pna) else [(yb, pna, w), (pna, yt, w)]
        for pyb, pyt, pw in pieces:
            a = pw * (pyt - pyb)
            yc = (pyt + pyb) / 2
            z += a * abs(yc - pna)
    return z


def h_plates(d, bf, tw, tf):
    return [(-d / 2, -d / 2 + tf, bf), (-d / 2 + tf, d / 2 - tf, tw), (d / 2 - tf, d / 2, bf)]


def set_pair(mt, us, key, mm_value, kind, decimals_mm=2, decimals_in=3):
    """kind: 'len' (plain mm/in), 'I' (x10^6mm4 mt / plain in4 us),
    'Z' (x10^3mm3 mt / plain in3 us), 'J' (x10^3mm4 mt / plain in4 us),
    'Cw' (x10^9mm6 mt / plain in6 us)."""
    if mm_value is None:
        return
    if kind == "len":
        mt[key] = fmt(mm_value, decimals_mm)
        us[key] = fmt(mm_value * MM_TO_IN, decimals_in)
    elif kind == "I":
        mt[key] = fmt(mm_value / 1e6, 3)
        us[key] = fmt(mm_value * MM4_TO_IN4, 3)
    elif kind == "Z":
        mt[key] = fmt(mm_value / 1000, 2)
        us[key] = fmt(mm_value * MM3_TO_IN3, 3)
    elif kind == "J":
        mt[key] = fmt(mm_value / 1000, 2)
        us[key] = fmt(mm_value * MM4_TO_IN4, 3)
    elif kind == "Cw":
        mt[key] = fmt(mm_value / 1e9, 3)
        us[key] = fmt(mm_value * MM6_TO_IN6, 1)


def augment_ksh(s):
    mt, us = s["mt"], s["us"]
    d, bf, tw, tf, r = (fnum(mt.get(k)) for k in ("d", "bf", "tw", "tf", "r"))
    if None in (d, bf, tw, tf, r):
        return
    Ix_mm4 = fnum(mt.get("Ix")) * 1e6 if mt.get("Ix") is not None else None
    Iy_mm4 = fnum(mt.get("Iy")) * 1e6 if mt.get("Iy") is not None else None
    if Ix_mm4 is None or Iy_mm4 is None:
        return

    kdes_mm = tf + r
    k1_mm = tw / 2 + r
    kdet_mm = kdes_mm
    T_mm = d - 2 * kdes_mm
    J_mm4 = (2 * bf * tf ** 3 + (d - 2 * tf) * tw ** 3) / 3
    ho_mm = d - tf
    Cw_mm6 = Iy_mm4 * ho_mm ** 2 / 4
    Sx_mm3 = Ix_mm4 / (d / 2)
    rts_mm = math.sqrt(math.sqrt(Iy_mm4 * Cw_mm6) / Sx_mm3)

    set_pair(mt, us, "k1", k1_mm, "len", 2, 3)
    set_pair(mt, us, "kdet", kdet_mm, "len", 2, 3)
    set_pair(mt, us, "T", T_mm, "len", 1, 2)
    set_pair(mt, us, "J", J_mm4, "J")
    set_pair(mt, us, "Cw", Cw_mm6, "Cw")
    set_pair(mt, us, "rts", rts_mm, "len", 1, 3)
    set_pair(mt, us, "ho", ho_mm, "len", 1, 2)


def augment_ksc(s):
    mt, us = s["mt"], s["us"]
    d, bf, tw, tf = (fnum(mt.get(k)) for k in ("d", "bf", "tw", "tf"))
    if None in (d, bf, tw, tf) or not (d > 2 * tf > 0) or not (bf > tw > 0):
        return

    A_geo = bf * d - (bf - tw) * (d - 2 * tf)
    Ix_mm4 = (bf * d ** 3 - (bf - tw) * (d - 2 * tf) ** 3) / 12
    Sx_mm3 = Ix_mm4 / (d / 2)
    rx_mm = math.sqrt(Ix_mm4 / A_geo)
    Zx_mm3 = plastic_modulus(h_plates(d, bf, tw, tf))

    Iy0_mm4 = (d * bf ** 3 - (d - 2 * tf) * (bf ** 3 - tw ** 3)) / 3
    xbar_mm = (bf * d * (bf / 2) - (bf - tw) * (d - 2 * tf) * ((tw + bf) / 2)) / A_geo
    Iy_mm4 = Iy0_mm4 - A_geo * xbar_mm ** 2
    ry_mm = math.sqrt(Iy_mm4 / A_geo)
    Sy_mm3 = Iy_mm4 / (bf - xbar_mm)  # governing (toe) side
    Zy_mm3 = plastic_modulus([(0, tw, d), (tw, bf, 2 * tf)])

    set_pair(mt, us, "Ix", Ix_mm4, "I")
    set_pair(mt, us, "Iy", Iy_mm4, "I")
    set_pair(mt, us, "Sx", Sx_mm3, "Z")
    set_pair(mt, us, "Sy", Sy_mm3, "Z")
    set_pair(mt, us, "Zx", Zx_mm3, "Z")
    set_pair(mt, us, "Zy", Zy_mm3, "Z")
    set_pair(mt, us, "rx", rx_mm, "len", 2, 3)
    set_pair(mt, us, "ry", ry_mm, "len", 2, 3)
    set_pair(mt, us, "x", xbar_mm, "len", 2, 3)


def augment_kst(s):
    mt, us = s["mt"], s["us"]
    d, bf, tw, tf = (fnum(mt.get(k)) for k in ("d", "bf", "tw", "tf"))
    if None in (d, bf, tw, tf) or not (d > tf > 0) or not (bf > 0 and tw > 0):
        return

    A1, A2 = bf * tf, tw * (d - tf)
    A_geo = A1 + A2
    y1, y2 = tf / 2, tf + (d - tf) / 2
    yTop = (A1 * y1 + A2 * y2) / A_geo
    yBot = d - yTop
    I1 = (bf * tf ** 3) / 12 + A1 * (yTop - y1) ** 2
    I2 = (tw * (d - tf) ** 3) / 12 + A2 * (y2 - yTop) ** 2
    Ix_mm4 = I1 + I2
    Iy_mm4 = (tf * bf ** 3) / 12 + ((d - tf) * tw ** 3) / 12
    Zx_mm3 = plastic_modulus([(-yBot, yTop - tf, tw), (yTop - tf, yTop, bf)])
    Zy_mm3 = (bf ** 2 * tf) / 4 + (tw ** 2 * (d - tf)) / 4
    J_mm4 = (bf * tf ** 3 + (d - tf) * tw ** 3) / 3
    Sx_mm3 = Ix_mm4 / max(yTop, yBot)
    rx_mm = math.sqrt(Ix_mm4 / A_geo)
    ry_mm = math.sqrt(Iy_mm4 / A_geo)

    set_pair(mt, us, "Ix", Ix_mm4, "I")
    set_pair(mt, us, "Iy", Iy_mm4, "I")
    set_pair(mt, us, "Sx", Sx_mm3, "Z")
    set_pair(mt, us, "Zx", Zx_mm3, "Z")
    set_pair(mt, us, "Zy", Zy_mm3, "Z")
    set_pair(mt, us, "rx", rx_mm, "len", 2, 3)
    set_pair(mt, us, "ry", ry_mm, "len", 2, 3)
    set_pair(mt, us, "y", yTop, "len", 2, 3)
    set_pair(mt, us, "J", J_mm4, "J")


def augment_ksp(s):
    mt, us = s["mt"], s["us"]
    od, t, a = fnum(mt.get("OD")), fnum(mt.get("tdes") or mt.get("tnom")), fnum(mt.get("A"))
    if None in (od, t, a) or not (od > 2 * t > 0) or not a:
        return

    idm = od - 2 * t
    Ix_mm4 = (math.pi / 64) * (od ** 4 - idm ** 4)
    Sx_mm3 = Ix_mm4 / (od / 2)
    Zx_mm3 = (od ** 3 - idm ** 3) / 6
    J_mm4 = 2 * Ix_mm4
    C_mm3 = 2 * Sx_mm3
    r_mm = math.sqrt(Ix_mm4 / a)

    for key in ("Ix", "Iy"):
        set_pair(mt, us, key, Ix_mm4, "I")
    for key in ("Sx", "Sy"):
        set_pair(mt, us, key, Sx_mm3, "Z")
    for key in ("Zx", "Zy"):
        set_pair(mt, us, key, Zx_mm3, "Z")
    for key in ("rx", "ry"):
        set_pair(mt, us, key, r_mm, "len", 2, 3)
    set_pair(mt, us, "J", J_mm4, "J")
    set_pair(mt, us, "C", C_mm3, "Z")


def augment_ksb(s):
    mt, us = s["mt"], s["us"]
    h, b, t = fnum(mt.get("Ht")), fnum(mt.get("B")), fnum(mt.get("tdes") or mt.get("tnom"))
    if None in (h, b, t) or not (h > 2 * t > 0) or not (b > 2 * t):
        return

    hi, bi = h - 2 * t, b - 2 * t
    A_geo = b * h - bi * hi
    Ix_mm4 = (b * h ** 3 - bi * hi ** 3) / 12
    Iy_mm4 = (h * b ** 3 - hi * bi ** 3) / 12
    Sx_mm3 = Ix_mm4 / (h / 2)
    Sy_mm3 = Iy_mm4 / (b / 2)
    Zx_mm3 = (b * h ** 2 - bi * hi ** 2) / 4
    Zy_mm3 = (h * b ** 2 - hi * bi ** 2) / 4
    rx_mm = math.sqrt(Ix_mm4 / A_geo)
    ry_mm = math.sqrt(Iy_mm4 / A_geo)
    Am = (b - t) * (h - t)
    pm = 2 * ((b - t) + (h - t))
    J_mm4 = 4 * Am ** 2 * t / pm

    set_pair(mt, us, "Ix", Ix_mm4, "I")
    set_pair(mt, us, "Iy", Iy_mm4, "I")
    set_pair(mt, us, "Sx", Sx_mm3, "Z")
    set_pair(mt, us, "Sy", Sy_mm3, "Z")
    set_pair(mt, us, "Zx", Zx_mm3, "Z")
    set_pair(mt, us, "Zy", Zy_mm3, "Z")
    set_pair(mt, us, "rx", rx_mm, "len", 2, 3)
    set_pair(mt, us, "ry", ry_mm, "len", 2, 3)
    set_pair(mt, us, "J", J_mm4, "J")


AUGMENTERS = {
    "ksh": augment_ksh, "ksc": augment_ksc, "kst": augment_kst,
    "ksp": augment_ksp, "ksb": augment_ksb,
}


def main():
    for fname, fn in AUGMENTERS.items():
        path = DATA_DIR / f"{fname}.json"
        with open(path, encoding="utf-8") as f:
            shapes = json.load(f)
        n_updated = 0
        for s in shapes:
            before = dict(s["mt"])
            fn(s)
            if s["mt"] != before:
                n_updated += 1
        with open(path, "w", encoding="utf-8") as f:
            json.dump(shapes, f, ensure_ascii=False)
        print(f"  {fname}: {n_updated}/{len(shapes)} shapes augmented")

    # kspp.json has no build_ks_data.py source pipeline (round tube, same
    # formulas as KSP) - augment it in place the same way.
    path = DATA_DIR / "kspp.json"
    with open(path, encoding="utf-8") as f:
        shapes = json.load(f)
    n_updated = 0
    for s in shapes:
        before = dict(s["mt"])
        augment_ksp(s)
        if s["mt"] != before:
            n_updated += 1
    with open(path, "w", encoding="utf-8") as f:
        json.dump(shapes, f, ensure_ascii=False)
    print(f"  kspp: {n_updated}/{len(shapes)} shapes augmented")


if __name__ == "__main__":
    main()
