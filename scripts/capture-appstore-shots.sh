#!/bin/bash
# Captures App Store screenshots: boots the Pro Max simulator, runs the
# staging UI test (which holds each key screen for ~4s), and photographs
# the simulator once a second from the host. Every screenshot call gets a
# watchdog so a mid-reboot stall can never hang the loop.
set -u
UDID="243C87B3-2BB8-4D5D-90F0-A1C77129417F" # iPhone 17 Pro Max, iOS 26.5
OUT="/tmp/versefold-burst"
IOS_DIR="$(cd "$(dirname "$0")/../ios" && pwd)"

rm -rf "$OUT" && mkdir -p "$OUT"

xcrun simctl boot "$UDID" 2>/dev/null
xcrun simctl bootstatus "$UDID" -b   # block until fully booted

cd "$IOS_DIR"
# -parallel-testing-enabled NO keeps the test on THIS simulator; otherwise
# Xcode runs it on an invisible clone and we photograph the wrong device.
xcodebuild test \
  -project Versefold.xcodeproj -scheme Versefold \
  -destination "id=$UDID" \
  -skip-testing:VersefoldUITests/PenAndScrollTests \
  -parallel-testing-enabled NO \
  > /tmp/shots-run.log 2>&1 &
XCPID=$!

i=0
while kill -0 "$XCPID" 2>/dev/null && [ "$i" -lt 240 ]; do
  i=$((i + 1))
  n=$(printf "%03d" "$i")
  xcrun simctl io "$UDID" screenshot "$OUT/f$n.png" >/dev/null 2>&1 &
  SPID=$!
  ( sleep 5 && kill "$SPID" 2>/dev/null ) &
  wait "$SPID" 2>/dev/null
  sleep 0.6
done
wait "$XCPID"
RESULT=$?
grep -c "TEST SUCCEEDED" /tmp/shots-run.log
echo "frames: $(ls "$OUT" | wc -l | tr -d ' ') exit: $RESULT"
