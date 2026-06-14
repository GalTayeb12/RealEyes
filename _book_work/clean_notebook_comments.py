# -*- coding: utf-8 -*-
"""Clean comments in the_modles_fixed_new.ipynb for submission."""
import json
import re
import copy

NOTEBOOK = '/home/sceuser/RealEyes/RealEyes/the_modles_fixed_new.ipynb'

# Lines to remove entirely (comment-only, not useful for submission)
REMOVE_PATTERNS = [
    re.compile(r'^#+\s*DO NOT RUN', re.I),
    re.compile(r'^\s*#\s*$'),
    re.compile(r'FILL AFTER TRAINING', re.I),
    re.compile(r'^#\s*Verify totals\s*$'),
    re.compile(r'^#\s*Sanity check\s*$'),
    re.compile(r'^#\s*Metrics summary\s*$'),
    re.compile(r'^#\s*Save to Drive\s*$'),
    re.compile(r'mותאם למחברת'),
    re.compile(r'^#\s*Usage in a web app', re.I),
    re.compile(r'^#\s*-{10,}'),
    re.compile(r'^#\s*@app\.'),
    re.compile(r'^#\s*def analyze'),
    re.compile(r'^#\s*img = load_uploaded'),
    re.compile(r'^#\s*overlay, prob'),
    re.compile(r'^#\s*is_fake = '),
    re.compile(r'^#\s*return \{"fake'),
    re.compile(r'^#\s*"verdict"'),
    re.compile(r'^#\s*"heatmap_image"'),
]

DECOR = re.compile(
    r'^(\s*)# [\=\-─═━\*]{3,}|'
    r'^(\s*)# .*[\=\-─═━\*]{8,}.*$|'
    r'^(\s*)# ═+|'
    r'^(\s*)# ─{5,}'
)

SECTION = re.compile(
    r'^(\s*)#+\s*#?\s*=+\s*(.+?)\s*=+\s*$|^(\s*)##\d+#\s*=+\s*(.+?)\s*=+\s*$',
    re.I,
)

HEBREW_INLINE = {
    'תמיד 1 לזיוף': 'label 1 = FAKE',
    'תמיד 0 לאמיתי': 'label 0 = REAL',
}


def is_decor(line):
    s = line.strip()
    if not s.startswith('#'):
        return False
    body = s[1:].strip()
    if re.fullmatch(r'[\=\-─═━\*]+', body):
        return True
    if DECOR.match(line):
        return True
    if re.match(r'^# [\=\-─═━\*]{4,}', s):
        return True
    if re.match(r'^# .*[\=\-─═━\*]{6,}\s*$', s):
        return True
    return False


def should_remove(line):
    for pat in REMOVE_PATTERNS:
        if pat.search(line):
            return True
    return False


def simplify_section(line):
    m = SECTION.match(line)
    if m:
        title = (m.group(2) or m.group(4) or '').strip()
        if title:
            return f'# {title}\n'
    m2 = re.match(r'^(\s*)#+\s*=+\s*(.+?)\s*=+\s*$', line.strip())
    if m2:
        return f'# {m2.group(2).strip()}\n'
    return None


def clean_inline_comment(code_part, comment_part):
    c = comment_part.strip()
    for heb, eng in HEBREW_INLINE.items():
        if heb in c:
            c = eng
    # drop noisy inline comments
    drop = [
        'if we want to load a model we write here the name of the model',
        'already defined by cell 38',
        'skip if already there',
    ]
    for d in drop:
        if d in c.lower():
            return code_part.rstrip() + '\n'
    # shorten verbose inlines
    shorten = {
        'extract 1 frame per second (increase for more images)': 'frames per second',
        'cap per video to avoid class imbalance': 'max frames per video',
        'train / val / test': 'train/val/test split',
        'label smoothing reduces overconfidence': 'label smoothing',
        'smaller batch — two large tensors per sample': 'reduced batch (dual streams)',
    }
    for old, new in shorten.items():
        if old in c:
            c = new
    if not c:
        return code_part.rstrip() + '\n'
    return f'{code_part.rstrip()}  # {c}\n'


def clean_comment_line(line):
    if should_remove(line):
        return None
    if is_decor(line):
        return None
    sec = simplify_section(line)
    if sec:
        return sec
    s = line.strip()
    # numbered viz step headers
    if re.match(r'^# \d+\.', s) or re.match(r'^# FIGURE \d+:', s, re.I):
        return None
    if re.match(r'^# =+ \d+\.', s):
        return None
    # long folder trees / bullet trees in comments
    if re.match(r'^#\s+[├└│]', s) or re.match(r'^#\s+├──', s):
        return None
    if re.match(r'^#\s+On disk\s*:', s) or re.match(r'^#\s+In GDrive:', s):
        return None
    if 'Google Drive will show' in s:
        return None
    if re.match(r'^#\s+✅ Set USE_CIFAKE', s):
        return None
    # condense multi-line blocks handled separately
    return line


def condense_header_comments(lines, cell_idx):
    """Replace verbose header block after # Cell N with one section line."""
    if not lines:
        return lines
    out = [f'# Cell {cell_idx}\n']
    i = 1
    section_title = None
    extra_notes = []

    while i < len(lines):
        line = lines[i]
        if line.strip().startswith('import ') or line.strip().startswith('from '):
            break
        if line.strip() and not line.strip().startswith('#'):
            break
        if should_remove(line) or is_decor(line):
            i += 1
            continue
        sec = simplify_section(line)
        if sec:
            section_title = sec.strip()[2:].strip()
            i += 1
            continue
        s = line.strip()
        if not s.startswith('#'):
            break
        # keep at most 2 concise header notes
        note = s[1:].strip()
        if note and len(note) < 120 and not note.startswith('Cell '):
            if note not in (section_title or ''):
                extra_notes.append(note)
        i += 1

    if section_title:
        out.append(f'# {section_title}\n')
    for note in extra_notes[:2]:
        out.append(f'# {note}\n')
    out.extend(lines[i:])
    return out


CELL_HEADER_OVERRIDES = {
    1: ['# Setup: imports, seeds, GPU memory growth, disable XLA/JIT'],
    2: ['# Paths, model directories, dataset configuration, rclone helpers'],
    3: ['# Sync datasets and models from Google Drive via rclone'],
    5: ['# Celeb-DF v2 frame extraction (one-time; skip if frames already exist)'],
    6: ['# CustomWar train/val/test split 80/10/10 (one-time setup)'],
    7: ['# Helper: load image paths and binary labels from dataset folders'],
    18: ['# SRM autoencoder with SE blocks and residual connections; latent 16x16x256'],
    19: ['# Autoencoder sanity check (non-fatal on GPU errors)'],
    32: ['# CNN-SRM test visualizations: confusion matrix, ROC, score histogram'],
    41: ['# EfficientNetB0 test visualizations'],
    48: ['# Two-Stream test visualizations'],
    53: ['# Ensemble and all-models comparison plots (saved to Drive)'],
    55: ['# Grad-CAM batch visualization on test samples'],
    56: ['# Grad-CAM single-image demo (web backend entry point)'],
}


def process_cell_source(source, cell_idx):
    if isinstance(source, list):
        text = ''.join(source)
    else:
        text = source
    lines = text.splitlines(keepends=True)
    if not lines:
        return [f'# Cell {cell_idx}\n']

    # strip old cell header
    start = 0
    if lines[0].strip().startswith('# Cell'):
        start = 1
        while start < len(lines) and (
            lines[start].strip().startswith('#') or lines[start].strip() == ''
        ):
            s = lines[start].strip()
            if s.startswith('import ') or s.startswith('from '):
                break
            if s and not s.startswith('#'):
                break
            start += 1

    body = lines[start:]

    if cell_idx in CELL_HEADER_OVERRIDES:
        out = [f'# Cell {cell_idx}\n']
        for h in CELL_HEADER_OVERRIDES[cell_idx]:
            out.append(h + '\n')
    else:
        out = condense_header_comments([f'# Cell {cell_idx}\n'] + body, cell_idx)
        body = out[1:]
        # re-extract body after condense
        start2 = 1
        while start2 < len(out) and out[start2].strip().startswith('#'):
            start2 += 1
        header = out[:start2]
        body = out[start2:]
        out = header

    cleaned_body = []
    skip_next_blank = False
    for line in body:
        stripped = line.strip()

        # inline comment
        if '#' in line and not stripped.startswith('#'):
            if '  #' in line or '\t#' in line:
                idx = line.find('  #')
                if idx == -1:
                    idx = line.find('\t#')
                code_part = line[:idx]
                comment_part = line[idx + 3:]
                # ignore URLs/strings with #
                if code_part.count('"') % 2 == 0 and code_part.count("'") % 2 == 0:
                    cleaned_body.append(clean_inline_comment(code_part, comment_part))
                    continue

        if stripped.startswith('#'):
            cl = clean_comment_line(line)
            if cl is None:
                skip_next_blank = True
                continue
            line = cl

        if skip_next_blank and stripped == '':
            skip_next_blank = False
            continue
        skip_next_blank = False
        cleaned_body.append(line)

    result = out + cleaned_body

    # collapse 3+ consecutive blank lines
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
    """Light markdown cleanup — English only, concise."""
    text = ''.join(source) if isinstance(source, list) else source
    replacements = {
        '## Celeb-DF v2 — Setup (one-time)': '## Celeb-DF v2 Setup (one-time)',
        '# SRM Model': '# SRM Model',
        '#EfficientNetB0 Model': '# EfficientNetB0 Model',
        '# Two-Stream Model': '# Two-Stream Model',
        '# Ensemble Model': '# Ensemble Model',
        '# Grad-CAM — Heatmap Visualization': '# Grad-CAM Heatmap Visualization',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return [text] if not text.endswith('\n') else [text]


def main():
    with open(NOTEBOOK, encoding='utf-8') as f:
        nb = json.load(f)

    for idx, cell in enumerate(nb['cells']):
        if cell['cell_type'] == 'code':
            cell['source'] = process_cell_source(cell['source'], idx)
        elif cell['cell_type'] == 'markdown':
            cell['source'] = clean_markdown(cell['source'])

    with open(NOTEBOOK, 'w', encoding='utf-8') as f:
        json.dump(nb, f, ensure_ascii=False, indent=1)

    # verify
    with open(NOTEBOOK, encoding='utf-8') as f:
        nb2 = json.load(f)
    hebrew = []
    for idx, cell in enumerate(nb2['cells']):
        if cell['cell_type'] != 'code':
            continue
        src = ''.join(cell['source'])
        if not src.startswith(f'# Cell {idx}'):
            print(f'WARN: idx {idx} header: {src.split(chr(10))[0]}')
        if re.search(r'[\u0590-\u05FF]', src):
            hebrew.append(idx)
    print(f'Done. Hebrew remaining in cells: {hebrew}')
    print(f'Total cells: {len(nb2["cells"])}')


if __name__ == '__main__':
    main()
