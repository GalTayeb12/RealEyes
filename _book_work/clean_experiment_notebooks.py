# -*- coding: utf-8 -*-
"""Clean comments in exp_* experiment notebooks for submission."""
import json
import re
import glob
import os

BASE = '/home/sceuser/RealEyes/RealEyes'

REMOVE_PATTERNS = [
    re.compile(r'^#+\s*DO NOT RUN', re.I),
    re.compile(r'FILL AFTER TRAINING', re.I),
    re.compile(r'^#\s*Usage in a web app', re.I),
    re.compile(r'^#\s*@app\.'),
    re.compile(r'mותאם'),
]

HEBREW_INLINE = {
    'תמיד 1 לזיוף': 'label 1 = FAKE',
    'תמיד 0 לאמיתי': 'label 0 = REAL',
}

DROP_INLINE = [
    'no-lora run',
    '80/20 split from main notebook',
    'customwar split',
]

# Per-notebook index -> concise section header (notebook cell index)
HEADERS = {
    'exp_cnn_srm.ipynb': {
        1: 'Setup: imports, seeds, GPU, mixed precision',
        2: 'Paths, model directory, TensorBoard logging helpers',
        3: 'Database paths and cross-database experiment configuration',
        4: 'Data loading helpers (paths, labels, class weights)',
        5: 'SRM noise-extraction filter bank (8 filters)',
        6: 'SRM filter application and tf.data pipeline',
        7: 'SRM autoencoder and encoder builder',
        8: 'CNN-SRM classifier with LoRA dense head',
        9: 'Evaluation metrics and result logging helpers',
        10: 'Auto-backup and Google Drive sync utilities',
        11: 'Main cross-database training loop (5 train x 5 test)',
        12: 'Cross-database ROC-AUC results heatmap',
        13: 'ROC curves for all train/test pairs',
        14: 'Confusion matrix grid (5x5)',
        15: 'Per-class metrics bar chart',
        16: 'Final sync of experiment artifacts to Google Drive',
        17: 'Save results table to CSV/pickle',
        18: 'TensorBoard launch instructions',
    },
    'exp_cnn_srm_no_lora.ipynb': {
        1: 'Setup: imports, seeds, GPU, mixed precision',
        2: 'Paths, model directory, TensorBoard logging helpers',
        3: 'Database paths and cross-database experiment configuration',
        4: 'Data loading helpers (paths, labels, class weights)',
        5: 'SRM noise-extraction filter bank (8 filters)',
        6: 'SRM filter application and tf.data pipeline',
        7: 'SRM autoencoder and encoder builder',
        8: 'CNN-SRM classifier (full fine-tuning, no LoRA)',
        9: 'Evaluation metrics and result logging helpers',
        10: 'Main cross-database training loop (5 train x 5 test)',
        11: 'Cross-database ROC-AUC results heatmap',
        12: 'TensorBoard launch instructions',
    },
    'exp_efficientnet.ipynb': {
        1: 'Setup: imports, seeds, GPU, mixed precision',
        2: 'Paths, model directory, TensorBoard logging helpers',
        3: 'Database paths and cross-database experiment configuration',
        4: 'Data loading helpers (paths, labels, class weights)',
        5: 'EfficientNet RGB dataset pipeline with augmentation',
        6: 'EfficientNetB0 builder with LoRA on classification head',
        7: 'Evaluation metrics and result logging helpers',
        8: 'Auto-backup and Google Drive sync utilities',
        9: 'Main cross-database training loop (5 train x 5 test)',
        10: 'Cross-database ROC-AUC results heatmap',
        11: 'ROC curves for all train/test pairs',
        12: 'Confusion matrix grid (5x5)',
        13: 'Per-class metrics bar chart',
        14: 'Final sync of experiment artifacts to Google Drive',
        15: 'Save results table to CSV/pickle',
        16: 'TensorBoard launch instructions',
    },
    'exp_efficientnet_no_lora.ipynb': {
        1: 'Setup: imports, seeds, GPU, mixed precision',
        2: 'Paths, model directory, TensorBoard logging helpers',
        3: 'Database paths and cross-database experiment configuration',
        4: 'Data loading helpers (paths, labels, class weights)',
        5: 'EfficientNet RGB dataset pipeline with augmentation',
        6: 'EfficientNetB0 builder (full fine-tuning, no LoRA)',
        7: 'Evaluation metrics and result logging helpers',
        8: 'Main cross-database training loop (5 train x 5 test)',
        9: 'Cross-database ROC-AUC results heatmap',
        10: 'TensorBoard launch instructions',
    },
    'exp_vit.ipynb': {
        1: 'Setup: imports, seeds, GPU, mixed precision',
        2: 'Paths, model directory, TensorBoard logging helpers',
        3: 'Database paths and cross-database experiment configuration',
        4: 'Data loading helpers (paths, labels, class weights)',
        5: 'ViT RGB dataset pipeline with augmentation',
        6: 'Combined dataset builder for ALL-database training',
        7: 'ViT-Tiny builder with LoRA on MLP layers',
        8: 'Evaluation metrics and result logging helpers',
        9: 'Auto-backup and Google Drive sync utilities',
        10: 'Main cross-database training loop (5 train x 5 test)',
        11: 'Cross-database ROC-AUC results heatmap',
        12: 'Prediction score histograms by train/test pair',
        13: 'ROC curves for all train/test pairs',
        14: 'Confusion matrix grid (5x5)',
        15: 'Per-class metrics bar chart',
        16: 'Final sync of experiment artifacts to Google Drive',
        17: 'TensorBoard launch instructions',
    },
    'exp_vit_no_lora.ipynb': {
        1: 'Setup: imports, seeds, GPU, mixed precision',
        2: 'Paths, model directory, TensorBoard logging helpers',
        3: 'Database paths and cross-database experiment configuration',
        4: 'Data loading helpers (paths, labels, class weights)',
        5: 'ViT RGB dataset pipeline with augmentation',
        6: 'ViT-Light builder (full fine-tuning, no LoRA)',
        7: 'Evaluation metrics and result logging helpers',
        8: 'Main cross-database training loop (5 train x 5 test)',
        9: 'Cross-database ROC-AUC results heatmap',
        10: 'TensorBoard launch instructions',
    },
}

OLD_BANNER = re.compile(
    r'^#+\s*=+\s*(?:CELL\s+\d+[a-z]?\s*:\s*)?(.+?)\s*=+\s*$',
    re.I | re.M,
)
OLD_BANNER2 = re.compile(r'^#+\s*=+\s*CELL\s+\d+[a-z]?\s*:\s*(.+?)\s*=+\s*$', re.I)
STEP_COMMENT = re.compile(
    r'^(\s*)# [─═\-]{2,}\s*(?:STEP|Phase|Fig)\s+[\dA-Z:.].*$', re.I
)
DECOR_LINE = re.compile(
    r'^(\s*)# [─═\-=]{5,}|^(\s*)# [─═\-=].*[─═\-=]{5,}\s*$'
)
ARCH_SECTION = re.compile(r'^(\s*)# [─═\-]{2,}\s*(Patch|Positional|Transformer|Final|Classification|LoRA).*$', re.I)


def is_old_banner(line):
    s = line.strip()
    if OLD_BANNER2.match(s):
        return True
    if re.match(r'^# =+', s) and ('CELL' in s.upper() or 'AUTO-BACKUP' in s.upper()
                                  or 'FINAL GOOGLE' in s.upper()):
        return True
    if re.match(r'^# =+ MAIN EXPERIMENT', s, re.I):
        return True
    return False


def should_remove_line(line):
    s = line.strip()
    if not s.startswith('#'):
        return False
    for pat in REMOVE_PATTERNS:
        if pat.search(line):
            return True
    if is_old_banner(line):
        return True
    if DECOR_LINE.match(line):
        return True
    if STEP_COMMENT.match(line):
        return True
    if ARCH_SECTION.match(line):
        return True
    if re.match(r'^#\s*$', s):
        return True
    # long instructional blocks in tensorboard cell - keep first line only via header
    if s.startswith('# Run on server:') or s.startswith('# Then open browser:'):
        return True
    if re.match(r'^# ssh -L', s):
        return False  # keep ssh instruction
    if re.match(r'^# tensorboard ', s, re.I):
        return False
    # remove duplicate experiment description blocks at start of main loop
    if s.startswith('# For each training database'):
        return True
    if s.startswith('# ViT trains from scratch'):
        return True
    if 'SMART RESUME' in s:
        return True
    if re.match(r'^# ── Phase [AB]:', s):
        return True
    if re.match(r'^# ── Final save', s):
        return True
    if re.match(r'^# ── Save all_predictions', s):
        return True
    if re.match(r'^# Green = best', s):
        return True
    if 'Option A' in s and 'no cross-db leakage' in s:
        return True
    return False


def clean_inline(code_part, comment_part):
    c = comment_part.strip()
    for heb, eng in HEBREW_INLINE.items():
        if heb in c:
            c = eng
    for d in DROP_INLINE:
        if d.lower() in c.lower():
            return code_part.rstrip() + '\n'
    if not c or len(c) > 80:
        return code_part.rstrip() + '\n'
    return f'{code_part.rstrip()}  # {c}\n'


def process_cell(source, cell_idx, nb_name):
    text = ''.join(source) if isinstance(source, list) else source
    if not text.strip():
        return [f'# Cell {cell_idx}\n', '# (empty cell)\n']

    lines = text.splitlines(keepends=True)

    # strip leading old banners / cell markers
    while lines and (lines[0].strip().startswith('# Cell') or is_old_banner(lines[0]) or
                     (lines[0].strip().startswith('#') and '===' in lines[0])):
        lines.pop(0)
    while lines and lines[0].strip() == '':
        lines.pop(0)

    header = [f'# Cell {cell_idx}\n']
    title = HEADERS.get(nb_name, {}).get(cell_idx)
    if title:
        header.append(f'# {title}\n')

    cleaned = []
    skip_blank = False
    for line in lines:
        stripped = line.strip()

        # remove embedded old banners anywhere
        if is_old_banner(line):
            skip_blank = True
            continue

        # inline comments
        if '#' in line and not stripped.startswith('#'):
            if '  #' in line:
                idx = line.find('  #')
                code_part = line[:idx]
                if code_part.count('"') % 2 == 0 and code_part.count("'") % 2 == 0:
                    cleaned.append(clean_inline(code_part, line[idx + 3:]))
                    continue

        if stripped.startswith('#'):
            if should_remove_line(line):
                skip_blank = True
                continue
            # simplify remaining ALL-CAPS section comments
            m = OLD_BANNER2.match(stripped)
            if m:
                skip_blank = True
                continue
            # keep short useful comments
            if len(stripped) > 120:
                skip_blank = True
                continue

        if skip_blank and stripped == '':
            skip_blank = False
            continue
        skip_blank = False
        cleaned.append(line)

    result = header + cleaned

    # collapse blank lines
    final = []
    blanks = 0
    for line in result:
        if line.strip() == '':
            blanks += 1
            if blanks <= 2:
                final.append(line)
        else:
            blanks = 0
            final.append(line)
    return final


def clean_markdown(source):
    text = ''.join(source) if isinstance(source, list) else source
    # normalize em-dashes in titles only
    text = text.replace('— Cross-Database', ' - Cross-Database')
    return [text]


def process_notebook(path):
    nb_name = os.path.basename(path)
    with open(path, encoding='utf-8') as f:
        nb = json.load(f)

    for idx, cell in enumerate(nb['cells']):
        if cell['cell_type'] == 'code':
            cell['source'] = process_cell(cell['source'], idx, nb_name)
        elif cell['cell_type'] == 'markdown':
            cell['source'] = clean_markdown(cell['source'])

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(nb, f, ensure_ascii=False, indent=1)

    # verify
    with open(path, encoding='utf-8') as f:
        nb2 = json.load(f)
    issues = []
    for idx, cell in enumerate(nb2['cells']):
        if cell['cell_type'] != 'code':
            continue
        src = ''.join(cell['source'])
        if not src.startswith(f'# Cell {idx}'):
            issues.append(f'header@{idx}')
        if re.search(r'[\u0590-\u05FF]', src):
            issues.append(f'hebrew@{idx}')
        if '=====' in src and 'CELL' in src.upper():
            issues.append(f'old_banner@{idx}')
    return nb_name, len(nb2['cells']), issues


def main():
    paths = sorted(glob.glob(os.path.join(BASE, 'exp_*.ipynb')))
    for path in paths:
        name, n, issues = process_notebook(path)
        status = 'OK' if not issues else ', '.join(issues)
        print(f'{name}: {n} cells — {status}')


if __name__ == '__main__':
    main()
