#!/usr/bin/env python3
"""Build browser-ready JavaScript from data/tests.json. Requires only Python 3."""
from pathlib import Path
import json
root = Path(__file__).resolve().parent.parent
source = root / "data" / "tests.json"
tests = json.loads(source.read_text(encoding="utf-8"))
assert isinstance(tests, list) and tests, "Expected a nonempty list of tests"
ids = [t["id"] for t in tests]
assert len(ids) == len(set(ids)), "Test IDs must be unique"
for t in tests:
    numbers = [q["number"] for p in t["passages"] for s in p["sections"] for q in s["questions"]]
    assert len(numbers) == len(set(numbers)), f"Duplicate question numbers in {t['id']}"
content = "/* Generated from data/tests.json. Do not edit by hand. */\\nwindow.READING_TESTS = " + json.dumps(tests, ensure_ascii=False, indent=2) + ";\\n"
(root / "data" / "tests.js").write_text(content, encoding="utf-8")
print(f"Built {len(tests)} test(s) into data/tests.js")
