set -e
set -o nounset

curr_dir="$(pwd)"

echo "--------- Cleaning Kaldi source ---------"
cd kaldi/src
make distclean
cd "$curr_dir"

echo "--------- Cleaning Kaldi tools ---------"
cd kaldi/tools
make distclean
cd "$curr_dir"

echo "--------- Cleaning CLAPACK ---------"
cd clapack-wasm
bash clean_repo.sh
cd "$curr_dir"
