#!/usr/bin/env bash
# Renders the Chrome Web Store screenshots and promo tile from store/assets.html
set -euo pipefail
cd "$(dirname "$0")/.."

PORT=$(python3 -c 'import socket; s = socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1])')
python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER' EXIT
sleep 1

render() {
  chromium --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size="$2" --virtual-time-budget=5000 --screenshot="store/$3" \
    "http://127.0.0.1:$PORT/store/assets.html?shot=$1" 2>/dev/null
}

render meetings 1280,800 screenshot-1-meetings.png
render timing 1280,800 screenshot-2-timing.png
render signin 1280,800 screenshot-3-signin.png
render tile 440,280 promo-tile-440x280.png
