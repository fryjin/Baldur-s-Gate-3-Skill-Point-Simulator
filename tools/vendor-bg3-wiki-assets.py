#!/usr/bin/env python3
"""Compatibility entry point for the V8.2 HD asset vendor.

The v1 downloader used small UI/controller icons. Keep this filename so older
instructions continue to work, but route all execution to the HD-aware vendor.
"""
from pathlib import Path
import runpy

runpy.run_path(str(Path(__file__).with_name('vendor-bg3-wiki-assets-hd.py')), run_name='__main__')
