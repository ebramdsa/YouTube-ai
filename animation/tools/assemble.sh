#!/bin/sh
# Join the cold open and the rendered sections into one episode file.
# Usage: tools/assemble.sh <out.mp4> <crf> <part1.mp4> <part2.mp4> ...
# Video is re-encoded once at the given CRF (higher = smaller file); audio is re-encoded to AAC.
set -e
out=$1; crf=$2; shift 2
list=$(mktemp); for p in "$@"; do echo "file '$(realpath "$p")'" >> "$list"; done
ffmpeg -y -loglevel error -f concat -safe 0 -i "$list" -c:v libx264 -preset slow -crf "$crf" -pix_fmt yuv420p -tune animation \
  -c:a aac -b:a 160k -ar 48000 -movflags +faststart "$out"
rm "$list"
ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$out"
