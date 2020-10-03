#!/usr/bin/env bash

set -e

mkdir -p output
windres --input ./src/binjumper.rc --output ./output/binjumper.res --output-format=coff
gcc ./src/binjumper.c ./output/binjumper.res -Os -s -m32 -o ./output/binjumper.exe
yarn ts-node ./scripts/generateJS.ts
yarn tsc --noEmit false