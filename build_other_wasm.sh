#!/bin/sh

set -e
set -o nounset

echo "------- Building sample rate converter -------"
#emcc -O3 -s WASM=1 -s MODULARIZE=1 -s ENVIRONMENT='worker' -s BUILD_AS_WORKER=1 \

emcc -O0 -s WASM=1 -s MODULARIZE=1 -s ENVIRONMENT='worker' -s BUILD_AS_WORKER=1 \
     -s EXTRA_EXPORTED_RUNTIME_METHODS="['ccall']" \
     -s EXPORT_NAME='resampleTo16bint' \
     --post-js audio-resampler/em_src/resampleTo16bint_post.js \
     -I audio-resampler/src -o src/computations/resampleTo16bint.js \
     audio-resampler/em_src/resampleTo16bint.c audio-resampler/src/*.c
