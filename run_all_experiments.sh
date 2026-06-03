#!/usr/bin/env bash
# ============================================================
# run_all_experiments.sh
#
# Runs all three experiment notebooks SEQUENTIALLY in the
# background using nohup. Each notebook logs to its own file.
# You can close your terminal — they will keep running.
#
# Usage:
#   bash run_all_experiments.sh           # run all three
#   bash run_all_experiments.sh cnn_srm   # run one notebook
#   bash run_all_experiments.sh efficientnet
#   bash run_all_experiments.sh vit
#
# Check progress:
#   tail -f logs/cnn_srm.log
#   tail -f logs/efficientnet.log
#   tail -f logs/vit.log
# ============================================================

VENV_PYTHON="/home/sceuser/.virtualenvs/RealEyesModels/bin/python3"
NB_DIR="/home/sceuser/RealEyes/RealEyes"
LOG_DIR="$NB_DIR/logs"
mkdir -p "$LOG_DIR"

run_notebook() {
    local name=$1
    local nb="$NB_DIR/$name.ipynb"
    local log="$LOG_DIR/$name.log"
    echo "[$(date '+%H:%M:%S')] Starting $name ..."
    nohup "$VENV_PYTHON" -m jupyter nbconvert \
        --to notebook \
        --execute \
        --inplace \
        --ExecutePreprocessor.timeout=-1 \
        --ExecutePreprocessor.kernel_name=python3 \
        "$nb" > "$log" 2>&1
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        echo "[$(date '+%H:%M:%S')] DONE: $name"
    else
        echo "[$(date '+%H:%M:%S')] FAILED (exit $exit_code): $name — check $log"
    fi
}

TARGET="${1:-all}"

case "$TARGET" in
    cnn_srm)
        run_notebook exp_cnn_srm
        ;;
    efficientnet)
        run_notebook exp_efficientnet
        ;;
    vit)
        run_notebook exp_vit
        ;;
    all)
        echo "Running all 3 notebooks sequentially (one at a time to share GPU)."
        echo "Total estimated time: 6-18 hours depending on GPU."
        echo ""
        run_notebook exp_cnn_srm
        run_notebook exp_efficientnet
        run_notebook exp_vit
        echo ""
        echo "ALL DONE."
        ;;
    *)
        echo "Unknown target: $TARGET"
        echo "Usage: $0 [cnn_srm|efficientnet|vit|all]"
        exit 1
        ;;
esac
