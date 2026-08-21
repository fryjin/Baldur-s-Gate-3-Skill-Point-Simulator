#!/usr/bin/env python3
from pathlib import Path
import subprocess, shutil

ROOT=Path(__file__).resolve().parents[1]
V82=ROOT/"assets/v8/v82.js"
HTML=ROOT/"v8.html"
EXPECTED_V82_BLOB="b006e3e16d11f9565d68840e050c5580b61aa65a"
EXPECTED_HTML_BLOB="012b1871ba78e23a025471de352347d84c6da1ce"

def git_blob(path):
    try:
        return subprocess.check_output(["git","hash-object",str(path)],cwd=ROOT,text=True).strip()
    except Exception:
        return ""

def main():
    if not V82.exists() or not HTML.exists():
        print("Run from repository root.")
        return 2

    text=V82.read_text(encoding="utf-8")
    html=HTML.read_text(encoding="utf-8")

    if "V8.2.4" in text and "v824.css" in html:
        print("V8.2.4 readability patch already applied.")
        return 0

    js_blob=git_blob(V82)
    html_blob=git_blob(HTML)
    if js_blob and js_blob!=EXPECTED_V82_BLOB:
        print("ERROR: v82.js is not the checked V8.2.3 baseline.")
        print("current:",js_blob)
        print("expected:",EXPECTED_V82_BLOB)
        print("No file changed.")
        return 3
    if html_blob and html_blob!=EXPECTED_HTML_BLOB:
        print("ERROR: v8.html is not the checked V8.2.3 baseline.")
        print("current:",html_blob)
        print("expected:",EXPECTED_HTML_BLOB)
        print("No file changed.")
        return 4

    old_js=text
    old_html=html

    # UI/export version only. Storage key remains v8-2 compatible.
    text=text.replace("V8.2.3","V8.2.4")
    text=text.replace("version:'8.2.3'","version:'8.2.4'")

    if './assets/v8/v824.css' not in html:
        anchor='  <link rel="stylesheet" href="./assets/v8/v823.css">'
        if anchor not in html:
            raise RuntimeError("v823.css marker not found in v8.html")
        html=html.replace(anchor,anchor+'\n  <link rel="stylesheet" href="./assets/v8/v824.css">',1)
    html=html.replace("V8.2.3","V8.2.4")

    try:
        V82.write_text(text,encoding="utf-8")
        HTML.write_text(html,encoding="utf-8")
        if shutil.which("node"):
            subprocess.check_call(["node","--check",str(V82)],cwd=ROOT)
    except Exception:
        V82.write_text(old_js,encoding="utf-8")
        HTML.write_text(old_html,encoding="utf-8")
        raise

    print("Applied V8.2.4 Readability & Density Pass.")
    print("Changed: assets/v8/v82.js, v8.html")
    print("Added/updated: assets/v8/v824.css")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
