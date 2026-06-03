#!/usr/bin/env bash
# ============================================================
# backup_models.sh
# Creates a timestamped backup of ALL trained models before
# any destructive operation. Run this BEFORE retraining.
#
# Usage: bash backup_models.sh
# ============================================================
MODELS_ROOT="/home/sceuser/RealEyes/gdrive/deepfake_image_project/models/RealEyes_experiment"
BACKUP_ROOT="/home/sceuser/RealEyes/gdrive/deepfake_image_project/models/backups"
TS=$(date '+%Y%m%d_%H%M')
BACKUP_DIR="$BACKUP_ROOT/backup_$TS"

mkdir -p "$BACKUP_DIR"
for model in cnn_srm efficientnet vit; do
    src="$MODELS_ROOT/$model"
    if [ -d "$src" ] && [ "$(ls -A "$src" 2>/dev/null)" ]; then
        cp -r "$src" "$BACKUP_DIR/$model"
        echo "  Backed up $model → $BACKUP_DIR/$model"
    fi
done
echo ""
echo "Backup complete: $BACKUP_DIR"
echo "Disk usage: $(du -sh "$BACKUP_DIR" | cut -f1)"
