#!/bin/sh
# Add the background score (ducked under the narration) and English/Arabic subtitle tracks.
# Usage: tools/finish.sh <in.mp4> <music.wav> <en.srt> <ar.srt> <out.mp4>
set -e
in=$1; music=$2; en=$3; ar=$4; out=$5
ffmpeg -y -loglevel error -i "$in" -i "$music" -i "$en" -i "$ar" -filter_complex \
  "[0:a]asplit=2[voice][key];[1:a]volume=0.45[m];[m][key]sidechaincompress=threshold=0.02:ratio=5:attack=30:release=600[duck];[voice][duck]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.9[a]" \
  -map 0:v -map "[a]" -map 2 -map 3 -c:v copy -c:a aac -b:a 160k -ar 48000 -c:s mov_text \
  -metadata:s:s:0 language=eng -metadata:s:s:0 title=English -metadata:s:s:1 language=ara -metadata:s:s:1 title=العربية \
  -movflags +faststart "$out"
ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$out"
