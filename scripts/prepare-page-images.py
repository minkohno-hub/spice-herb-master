#!/usr/bin/env python3
"""ページ原画（スキャン画像）をアプリ収録用に変換するスクリプト（UX3、DECISIONS #38）。

入力: 原本スキャンのフォルダ（IMG_9577〜IMG_9716 の PNG 群）。
      既定は環境変数 SPICE_SCANS_DIR、無ければ ~/workspace/spice-check。
出力: public/pages-b64/IMG_XXXX.b64（幅1000px・WebP品質72 を Base64 化したテキスト）
      と目録 src/data/page-images.json。

GitHub への配信経路がテキストファイル前提のため、画像はバイナリのまま置かず
Base64 テキストとして収録し、アプリ側で Blob URL に戻して表示する。
ファイル番号と本書ページの対応は実測で確定した対応（p.71 までは ページ+9575、
p.72 以降は ページ+9576。IMG_9647 は欠落した扉でページ番号を持たない）。
IMG_9577〜9580 は表紙・目次などの前付けとして bookPage=null にする。

使い方: python3 scripts/prepare-page-images.py [スキャンのフォルダ]
"""
import base64
import io
import json
import os
import re
import sys

from PIL import Image

TARGET_WIDTH = 1000
WEBP_QUALITY = 72


def book_page_for(image_number: int):
    if image_number <= 9580:
        return None  # 表紙・目次などの前付け
    if image_number <= 9646:
        return image_number - 9575
    return image_number - 9576


def main() -> int:
    scans_dir = (
        sys.argv[1]
        if len(sys.argv) > 1
        else os.environ.get("SPICE_SCANS_DIR", os.path.expanduser("~/workspace/spice-check"))
    )
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = os.path.join(repo_root, "public", "pages-b64")
    os.makedirs(out_dir, exist_ok=True)

    manifest = []
    for filename in sorted(os.listdir(scans_dir)):
        m = re.fullmatch(r"(IMG_\d+)\.(png|PNG)", filename)
        if not m:
            continue
        image_id = m.group(1)
        number = int(image_id.split("_")[1])
        im = Image.open(os.path.join(scans_dir, filename)).convert("RGB")
        w, h = im.size
        resized = im.resize((TARGET_WIDTH, round(h * TARGET_WIDTH / w)), Image.LANCZOS)
        buf = io.BytesIO()
        resized.save(buf, "WEBP", quality=WEBP_QUALITY, method=6)
        raw = buf.getvalue()
        with open(os.path.join(out_dir, image_id + ".b64"), "w") as f:
            f.write(base64.b64encode(raw).decode())
        manifest.append(
            {
                "imageId": image_id,
                "bookPage": book_page_for(number),
                "width": TARGET_WIDTH,
                "height": resized.size[1],
                "webpBytes": len(raw),
            }
        )

    manifest_path = os.path.join(repo_root, "src", "data", "page-images.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    pages = sorted(e["bookPage"] for e in manifest if e["bookPage"] is not None)
    print(f"images: {len(manifest)}, pages: {pages[0]}-{pages[-1]} ({len(pages)}), "
          f"total webp: {sum(e['webpBytes'] for e in manifest) / 1048576:.1f} MB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
