#!/bin/bash
EFF_DIR="/home/sceuser/RealEyes/gdrive/deepfake_image_project/models/RealEyes_experiment/efficientnet"
LOG="/home/sceuser/RealEyes/RealEyes/eff_run.log"

echo "=============================================="
echo "  EfficientNet Training Status"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="

# Is the process running?
PID=$(ps aux | grep "nbconvert.*exp_efficientnet" | grep -v grep | awk '{print $2}')
if [ -n "$PID" ]; then
    ELAPSED=$(ps -p $PID -o etime= 2>/dev/null | tr -d ' ')
    # Find actual training subprocess (highest CPU child)
    CHILD=$(ps --ppid $PID -o pid=,pcpu= 2>/dev/null | sort -k2 -rn | head -1)
    CHILD_PID=$(echo $CHILD | awk '{print $1}')
    CHILD_CPU=$(echo $CHILD | awk '{print $2}')
    echo "  Status      : RUNNING (elapsed: $ELAPSED)"
    echo "  Training CPU: ${CHILD_CPU}%  (subprocess PID: $CHILD_PID)"
else
    echo "  Status      : STOPPED"
fi

# Results progress
echo ""
echo "  Results progress:"
python3 -c "
import pickle, os
path = '$EFF_DIR/all_results.pkl'
if not os.path.exists(path):
    print('  No results file yet')
else:
    r = pickle.load(open(path,'rb'))
    done = sum(len(v) for v in r.values())
    print(f'  Completed: {done}/25 evaluations')
    for db in ['OpenForensics','CustomWar','CelebDF','CiFake','ALL']:
        n = len(r.get(db,{}))
        bar = '█'*n + '░'*(5-n)
        s = 'DONE   ' if n==5 else ('PARTIAL' if n>0 else 'PENDING')
        print(f'  [{bar}] {n}/5  {s}  {db}')
"

# Latest saved model files with timestamps
echo ""
echo "  Latest saved models:"
ls -lht "$EFF_DIR"/*.keras 2>/dev/null | head -4 \
  | awk '{printf "  %s %s  %s\n", $7,$8, $9}' | sed 's|.*/||' \
  || echo "  None yet"

echo "=============================================="
echo "  TIP: watch -n 60 bash check_training.sh"
echo "=============================================="
