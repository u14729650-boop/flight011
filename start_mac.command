#!/bin/bash
# Double-click this file in Finder to run SkyVoyage on your Mac.
cd "$(dirname "$0")"
if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 is not installed. Get it from https://www.python.org/downloads/macos/ and run this again."
  read -r -p "Press Return to close..." _; exit 1
fi
if [ ! -d .venv ]; then
  echo "First run: setting up (takes about a minute)..."
  python3 -m venv .venv
  ./.venv/bin/pip install -q -r requirements.txt
fi
(sleep 2 && open "http://127.0.0.1:5000") &
echo "SkyVoyage is running at http://127.0.0.1:5000 — close this window to stop it."
./.venv/bin/python app.py
