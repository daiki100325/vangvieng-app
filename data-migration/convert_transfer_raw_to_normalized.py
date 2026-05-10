import argparse
import csv
import re
from pathlib import Path


STORE_LABEL_MAP = {
    "事務所": "office",
    "本店": "baba_main",
    "中野店": "nakano",
    "馬場２": "baba_2nd",
    "馬場2": "baba_2nd",
}

STORE_ORDER = ["office", "baba_main", "nakano", "baba_2nd"]


def fill_right(values):
    out = []
    cur = ""
    for v in values:
        t = (v or "").strip()
        if t:
            cur = t
        out.append(cur)
    return out


def normalize_number(raw):
    s = str(raw or "").strip().replace(",", "")
    if s in {"", "-", "—"}:
        return 0.0
    try:
        return float(s)
    except ValueError:
        return 0.0


def extract_brand_name(raw):
    s = str(raw or "").strip()
    if not s:
        return ""
    m = re.search(r"\(([^)]+)\)", s)
    if m:
        inner = m.group(1).strip()
        if inner:
            return inner
    return s


def normalize_block_comment(raw):
    s = str(raw or "").strip()
    if not s:
        return ""
    if s.upper() in {"TRUE", "FALSE"}:
        return ""
    return " ".join(s.split())


def parse_event_meta(label):
    # e.g. "(1)移動: 12/3(水)" or "03/30"
    m_idx = re.search(r"^\((\d+)\)", label)
    idx = int(m_idx.group(1)) if m_idx else None
    m_type = "move"
    if "入荷" in label:
        m_type = "arrival"
    elif "廃棄" in label:
        m_type = "dispose"
    elif "通関ミス" in label:
        m_type = "dispose"
    iso_date = ""
    m_iso = re.search(r"(\d{4})[-/](\d{1,2})[-/](\d{1,2})", label)
    if m_iso:
        y, mo, dd = m_iso.groups()
        iso_date = f"{int(y):04d}-{int(mo):02d}-{int(dd):02d}"

    m_date = re.search(r"(\d{1,2})/(\d{1,2})", label)
    mm = int(m_date.group(1)) if m_date else None
    dd = int(m_date.group(2)) if m_date else None
    return idx, m_type, mm, dd, iso_date


def event_date(base_year, month_num, mm, dd, iso_date=""):
    if iso_date:
        return iso_date
    if mm is None or dd is None:
        return ""
    year = base_year
    if mm > month_num:
        year -= 1
    return f"{year:04d}-{mm:02d}-{dd:02d}"


def classify_transfer(deltas):
    eps = 1e-9
    pos = [(k, v) for k, v in deltas.items() if v > eps]
    neg = [(k, v) for k, v in deltas.items() if v < -eps]

    if len(pos) == 1 and len(neg) == 1:
        p_store, p_val = pos[0]
        n_store, n_val = neg[0]
        qty = min(p_val, -n_val)
        return n_store, p_store, qty, "completed", ""
    if len(pos) == 1 and len(neg) == 0:
        p_store, p_val = pos[0]
        return "", p_store, p_val, "completed", "arrival"
    if len(pos) == 0 and len(neg) == 1:
        n_store, n_val = neg[0]
        return n_store, "", -n_val, "completed", "dispose"
    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--month-num", required=True, type=int)
    parser.add_argument("--base-year", required=True, type=int)
    args = parser.parse_args()

    src = Path(args.input)
    dst = Path(args.output)
    dst.parent.mkdir(parents=True, exist_ok=True)

    with src.open("r", encoding="utf-8-sig", newline="") as f:
        rows = list(csv.reader(f))
    if len(rows) < 3:
        raise ValueError("CSV rows are too short.")

    raw_h1 = rows[0]
    h1 = fill_right(raw_h1)
    h2 = rows[1]
    body = rows[2:]

    # Transfer records are fixed 4-column blocks between (B) and (C):
    # office, baba_main, nakano, baba_2nd. The 3rd column (1st row)
    # stores block-level comment text.
    b_start = next((i for i, top in enumerate(h1) if "(B)" in (top or "")), None)
    search_start = b_start + 4 if b_start is not None else 0
    search_end = next((i for i, top in enumerate(h1) if "(C)" in (top or "")), len(h1))

    event_defs = []
    i = search_start
    while i + 3 < search_end:
        cols = [i + offset for offset in range(4)]
        if cols[-1] >= len(h2):
            break
        if not all((h2[c] or "").strip() for c in cols):
            i += 4
            continue

        has_non_zero = False
        for r in body:
            for c in cols:
                if c < len(r) and abs(normalize_number(r[c])) > 1e-9:
                    has_non_zero = True
                    break
            if has_non_zero:
                break
        if not has_non_zero:
            i += 4
            continue

        tokens = []
        for c in cols:
            tok = (raw_h1[c] or "").strip()
            if tok and tok.upper() not in {"TRUE", "FALSE"}:
                tokens.append(tok)
        label = ""
        for tok in tokens:
            if re.match(r"^\(\d+\)", tok) or re.match(r"^\d{1,2}/\d{1,2}$", tok):
                label = tok
                break
        if not label and tokens:
            label = tokens[0]
        block_comment = normalize_block_comment(raw_h1[i + 2] if i + 2 < len(raw_h1) else "")

        _, _, mm, dd, iso_date = parse_event_meta(label or block_comment)
        col_to_store = {}
        for idx2, c in enumerate(cols):
            if idx2 < len(STORE_ORDER):
                col_to_store[c] = STORE_ORDER[idx2]
        if col_to_store:
            event_defs.append((label, block_comment, mm, dd, iso_date, col_to_store))
        i += 4

    out_headers = [
        "recorded_at",
        "period_key",
        "month_num",
        "from_store_key",
        "dest_store_key",
        "brand_name",
        "flavor_name",
        "quantity",
        "status",
        "comment",
    ]
    out_rows = []
    for r in body:
        if len(r) < 2:
            continue
        brand = extract_brand_name(r[0])
        flavor = (r[1] or "").strip()
        if not brand or not flavor:
            continue

        for label, block_comment, mm, dd, iso_date, col_to_store in event_defs:
            deltas = {}
            for c, store in col_to_store.items():
                if c < len(r):
                    val = normalize_number(r[c])
                    if abs(val) > 1e-9:
                        deltas[store] = val
            if not deltas:
                continue

            classified = classify_transfer(deltas)
            note = block_comment
            if not classified:
                # Keep unresolved patterns for manual review.
                anchor = note or label
                comment = f"ambiguous:{anchor}" if anchor else "ambiguous"
                qty = sum(v for v in deltas.values() if v > 0)
                out_rows.append([
                    event_date(args.base_year, args.month_num, mm, dd, iso_date),
                    f"{args.base_year:04d}{args.month_num:02d}",
                    str(args.month_num),
                    "",
                    "",
                    brand,
                    flavor,
                    f"{qty:.0f}" if float(qty).is_integer() else str(qty),
                    "pending",
                    comment,
                ])
                continue

            from_store, dest_store, qty, status, _hint = classified
            qty_str = f"{qty:.0f}" if float(qty).is_integer() else str(qty)
            out_rows.append([
                event_date(args.base_year, args.month_num, mm, dd, iso_date),
                f"{args.base_year:04d}{args.month_num:02d}",
                str(args.month_num),
                from_store,
                dest_store,
                brand,
                flavor,
                qty_str,
                status,
                note,
            ])

    with dst.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(out_headers)
        writer.writerows(out_rows)

    print(f"Events detected: {len(event_defs)}")
    print(f"Converted rows: {len(out_rows)}")
    print(f"Output: {dst}")


if __name__ == "__main__":
    main()
