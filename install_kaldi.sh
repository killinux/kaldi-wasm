#!/bin/bash

# This script assumes that the clapack directory is at the same level as kaldi

LAPACK_DIR=${1:-'clapack-wasm'}

ORIGIN_DIR=$(pwd)
#CXXFLAGS="-O3 -U HAVE_EXECINFO_H"
#LDFLAGS="-O3"
CXXFLAGS="-O0 -U HAVE_EXECINFO_H -msse -msse2 -msse3 -mssse3 -msse4.1 -msse4.2 -mavx  -msimd128"
LDFLAGS="-O0 -s ERROR_ON_UNDEFINED_SYMBOLS=0 -s EXPORTED_FUNCTIONS=['_main'] --bind"

cd kaldi/src
CXXFLAGS="$CXXFLAGS" LDFLAGS="$LDFLAGS" emconfigure ./configure --use-cuda=no \
    --static --clapack-root=../../"$LAPACK_DIR" --host=WASM
sed -i -e 's:-pthread::g; s:-lpthread::g' kaldi.mk
sed -i -e 's:-O1:-O0:g; ' kaldi.mk

emmake make -j clean depend
#emmake make -j $(nproc) online2bin
emmake make  online2bin

