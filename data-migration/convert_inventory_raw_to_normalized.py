import argparse
import csv
import re
from pathlib import Path


STORE_MAP = {
    "事務所": "office",
    "高田馬場本店": "baba_main",
    "中野店": "nakano",
    "高田馬場2号店": "baba_2nd",
}

SIZES = ["50g", "100g", "125g", "200g", "250g", "1kg"]


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
        return ""
    try:
        n = float(s)
    except ValueError:
        return ""
    if n.is_integer():
        return str(int(n))
    return str(n)


def normalize_date(raw, fallback=""):
    s = str(raw or "").strip()
    if not s:
        return fallback
    s = s.replace(".", "/").replace("-", "/")
    m = re.match(r"^(\d{4})/(\d{1,2})/(\d{1,2})$", s)
    if m:
        y, mo, d = m.groups()
        return f"{int(y):04d}-{int(mo):02d}-{int(d):02d}"
    m = re.match(r"^(\d{1,2})/(\d{1,2})$", s)
    if m and fallback:
        y = fallback[:4]
        mo, d = m.groups()
        return f"{int(y):04d}-{int(mo):02d}-{int(d):02d}"
    return fallback


def pick_col(headers_top, headers_sub, top_contains, sub_equals):
    for i, (h1, h2) in enumerate(zip(headers_top, headers_sub)):
        if top_contains in h1 and h2 == sub_equals:
            return i
    return None


def build_store_index(headers_top, headers_sub, store_jp):
    idx = {}
    idx["tupper_basic"] = pick_col(headers_top, headers_sub, f"{store_jp}タッパー", "基本")
    reserve_cols = [
        pick_col(headers_top, headers_sub, f"{store_jp}タッパー", "予備1"),
        pick_col(headers_top, headers_sub, f"{store_jp}タッパー", "予備2"),
        pick_col(headers_top, headers_sub, f"{store_jp}タッパー", "予備3"),
    ]
    idx["tupper_reserve_cols"] = [c for c in reserve_cols if c is not None]
    for s in SIZES:
        idx[f"stock_{s}"] = pick_col(headers_top, headers_sub, f"{store_jp}在庫", s)
        idx[f"merch_{s}"] = pick_col(headers_top, headers_sub, f"{store_jp}物販", s)
    idx["stock_other"] = pick_col(headers_top, headers_sub, f"{store_jp}在庫", "他")
    return idx


def sum_reserve(row, cols):
    vals = []
    for c in cols:
        v = normalize_number(row[c]) if c < len(row) else ""
        if v != "":
            vals.append(float(v))
    if not vals:
        return ""
    total = sum(vals)
    if float(total).is_integer():
        return str(int(total))
    return str(total)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--recorded-at", default="", help="Fallback YYYY-MM-DD")
    parser.add_argument("--month-num", type=int, default=12)
    args = parser.parse_args()

    src = Path(args.input)
    dst = Path(args.output)
    dst.parent.mkdir(parents=True, exist_ok=True)

    with src.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        rows = list(reader)

    if len(rows) < 3:
        raise ValueError("CSV rows are too short.")

    head_top = fill_right(rows[0])
    head_sub = rows[1]
    body = rows[2:]

    brand_col = 0
    flavor_col = 1
    completed_date_start = next((i for i, h in enumerate(head_top) if "棚卸し完了日" in h), None)
    completed_date_col = {}
    if completed_date_start is not None:
        order = ["office", "baba_main", "nakano", "baba_2nd"]
        for offset, key in enumerate(order):
            c = completed_date_start + offset
            if c < len(head_sub):
                completed_date_col[key] = c

    store_indices = {
        store_key: build_store_index(head_top, head_sub, store_jp)
        for store_jp, store_key in STORE_MAP.items()
    }

    out_headers = [
        "recorded_at",
        "period_key",
        "month_num",
        "store_key",
        "brand_name",
        "flavor_name",
        "tupper_basic",
        "tupper_reserve",
        "merch_pkg_50",
        "merch_pkg_100",
        "merch_pkg_125",
        "merch_pkg_200",
        "merch_pkg_250",
        "merch_pkg_1kg",
        "stock_pkg_50",
        "stock_pkg_100",
        "stock_pkg_125",
        "stock_pkg_200",
        "stock_pkg_250",
        "stock_pkg_1kg",
        "stock_other",
    ]

    out_rows = []
    for r in body:
        if len(r) < 2:
            continue
        brand = (r[brand_col] or "").strip()
        flavor = (r[flavor_col] or "").strip()
        if not brand or not flavor:
            continue

        for store_key, idx in store_indices.items():
            row_out = {
                "recorded_at": args.recorded_at,
                "period_key": f"{args.recorded_at[:4]}{args.month_num:02d}" if args.recorded_at else "",
                "month_num": str(args.month_num),
                "store_key": store_key,
                "brand_name": brand,
                "flavor_name": flavor,
                "tupper_basic": "",
                "tupper_reserve": "",
                "merch_pkg_50": "",
                "merch_pkg_100": "",
                "merch_pkg_125": "",
                "merch_pkg_200": "",
                "merch_pkg_250": "",
                "merch_pkg_1kg": "",
                "stock_pkg_50": "",
                "stock_pkg_100": "",
                "stock_pkg_125": "",
                "stock_pkg_200": "",
                "stock_pkg_250": "",
                "stock_pkg_1kg": "",
                "stock_other": "",
            }

            if idx["tupper_basic"] is not None and idx["tupper_basic"] < len(r):
                row_out["tupper_basic"] = normalize_number(r[idx["tupper_basic"]])
            row_out["tupper_reserve"] = sum_reserve(r, idx["tupper_reserve_cols"])

            size_to_key = {
                "50g": "50",
                "100g": "100",
                "125g": "125",
                "200g": "200",
                "250g": "250",
                "1kg": "1kg",
            }

            for s in SIZES:
                merch_col = idx.get(f"merch_{s}")
                stock_col = idx.get(f"stock_{s}")
                key = size_to_key[s]
                if merch_col is not None and merch_col < len(r):
                    row_out[f"merch_pkg_{key}"] = normalize_number(r[merch_col])
                if stock_col is not None and stock_col < len(r):
                    row_out[f"stock_pkg_{key}"] = normalize_number(r[stock_col])

            if idx["stock_other"] is not None and idx["stock_other"] < len(r):
                row_out["stock_other"] = normalize_number(r[idx["stock_other"]])

            date_col = completed_date_col.get(store_key)
            if date_col is not None and date_col < len(r):
                row_out["recorded_at"] = normalize_date(r[date_col], args.recorded_at)

            out_rows.append([row_out[h] for h in out_headers])

    with dst.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(out_headers)
        writer.writerows(out_rows)

    print(f"Converted rows: {len(out_rows)}")
    print(f"Output: {dst}")


if __name__ == "__main__":
    main()
