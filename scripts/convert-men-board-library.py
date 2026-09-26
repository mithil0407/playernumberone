"""Convert the Pinterest men's board inventory into the ICONIK men's library format.

Every decision is a visible rule below; nothing is judged by a model. The output
file states each look's occasion, so a look can be moved by editing one line.
usage: python3 convert_board.py <board.md> <out.md> [--report]
"""
import re
import sys
from collections import Counter, defaultdict

src, out = sys.argv[1], sys.argv[2]
raw = open(src).read()

def field(block, name):
    m = re.search(r'\*\*' + name + r':\*\*\s*(.+)', block)
    return m.group(1).strip().rstrip('.') if m else ''

def has(pattern, *texts):
    return re.search(pattern, ' '.join(texts), re.I) is not None

looks = []
for block in re.split(r'^## ', raw, flags=re.M)[1:]:
    head = block.split('\n', 1)[0]
    num, title = re.match(r'(\d+)\.\s*(.+)', head).groups()
    pin = re.search(r'\((https://[^)]+)\)', block)
    looks.append({
        'n': int(num), 'title': title.strip(), 'pin': pin.group(1) if pin else '',
        'top': field(block, 'Top'), 'bottom': field(block, 'Bottom'), 'layer': field(block, 'Layer'),
        'shoes': field(block, 'Shoes'), 'acc': field(block, 'Accessories'), 'notes': field(block, 'Styling notes'),
    })

NONE = r'^(none|none clearly visible|not visible)$'
TEE = r"\bt-shirt|\btee\b|tank|vest top|henley|sweatshirt|hoodie"
DENIM = r'\bjeans?\b|denim'
SHORTS = r'\bshorts\b'
SNEAKER = r'sneaker|trainer'
DRESS_SHOE = r'oxford|derby|dress shoe|leather shoe|loafer|monk|brogue'
TAILORING = r'blazer|sport coat|suit jacket|\bsuit\b'
# Statement outerwear is a jacket, not a shirt: a suede-look overshirt stays smart casual.
STATEMENT = r'(leather|suede)[^,;]*\b(jacket|bomber|blouson|biker)\b|bomber|varsity|biker|racer'
KURTA = r'kurta'
BANDHGALA = r'bandhgala|nehru|jodhpuri'

def context(l):
    t, b, lay, sh, acc = l['top'], l['bottom'], l['layer'], l['shoes'], l['acc']
    layer = '' if re.match(NONE, lay, re.I) else lay
    if has(KURTA, t): return 'Relaxed Casual', 'indian-casual'
    if has(BANDHGALA, t, layer): return 'Evening Wear', 'indian-formal'
    # Relaxed: shorts, or tee-led / casual shirts worn with denim or sneakers and no tailoring.
    if has(SHORTS, b): return 'Relaxed Casual', None
    if has(TEE, t) and not has(TAILORING, layer) and (has(DENIM, b) or has(SNEAKER, sh) or not layer):
        return 'Relaxed Casual', None
    if has(r'plaid|camp|hawaiian|short-sleeve', t) and has(DENIM, b): return 'Relaxed Casual', None
    # Office: tailoring or a collared shirt with tailored trousers and leather shoes; never denim/tees/sneakers.
    office_safe = not has(DENIM, b) and not has(TEE + r'|polo', t) and not has(SNEAKER, sh)
    if office_safe and (has(TAILORING, layer) or has(r'\btie\b', acc, t)): return 'Office / Formal', None
    if office_safe and has(r'button|dress shirt|oxford shirt|shirt', t) and not has(r'short-sleeve|plaid|camp|linen|overshirt', t) \
            and has(r'trouser|pants', b) and not layer and (has(DRESS_SHOE, sh) or has(NONE, sh)):
        return 'Office / Formal', None
    # Evening: statement leather/suede outerwear, or a dark top with dark bottoms.
    if has(STATEMENT, layer): return 'Evening Wear', None
    dark = r'\bblack|charcoal|navy|dark|midnight|burgundy|chocolate'
    if has(dark, t) and has(dark, b) and not has(SHORTS, b): return 'Evening Wear', None
    return 'Smart Casual', None

def silhouette(l, ctx, special):
    if special: return special
    t, b, lay = l['top'], l['bottom'], l['layer']
    layer = '' if re.match(NONE, lay, re.I) else lay
    if has(r'\bsuit\b', layer, t) or (has(TAILORING, layer) and has(r'matching', b)): return 'suit'
    if has(TAILORING, layer): return 'blazer-denim' if has(DENIM, b) else 'blazer-separates'
    if has(SHORTS, b): return 'shorts-set'
    if has(STATEMENT, layer): return 'statement-jacket'
    if layer and has(r'sweater|cardigan|knit|vest|zip', layer): return 'knit-layered'
    if layer and has(TEE, t): return 'tee-layered'
    if layer: return 'shirt-layered'
    if has(r'polo', t): return 'polo'
    if has(r'sweater|knit|pullover|jumper|cardigan|turtleneck|roll', t): return 'knit'
    if has(TEE, t): return 'tee-denim' if has(DENIM, b) else 'tee'
    if has(DENIM, b): return 'shirt-denim'
    return 'shirt-trousers'

DEFAULT_SHOES = {
    'Office / Formal': 'Dark brown leather loafers',
    'Smart Casual': 'Tan suede loafers',
    'Evening Wear': 'Dark brown suede Chelsea boots',
    'Relaxed Casual': 'White leather low-top sneakers',
}

def clean(value, fallback):
    value = value.strip()
    return fallback if not value or re.match(NONE, value, re.I) else value

by_ctx = defaultdict(list)
for l in looks:
    ctx, special = context(l)
    l['ctx'], l['sil'] = ctx, silhouette(l, ctx, special)
    shoes_default = re.match(NONE, l['shoes'], re.I) is not None or not l['shoes']
    l['footwear'] = DEFAULT_SHOES[ctx] if shoes_default else l['shoes']
    l['shoes_default'] = shoes_default
    by_ctx[ctx].append(l)

ORDER = ['Office / Formal', 'Smart Casual', 'Evening Wear', 'Relaxed Casual']
lines = [
    "# ICONIK MEN'S BOARD LIBRARY — PRIORITY LOOKS",
    '',
    "Source: Iconik's Men style board on Pinterest (https://in.pinterest.com/iconikindia/men-style/).",
    'These looks are picked before the core 100-look library. Occasion, silhouette family and',
    'default footwear were assigned by the rules in the conversion script, not by a model; to move a',
    'look, change its header. IDs are 200 + the board number. Looks marked PRIORITY: board are',
    'ranked ahead of ICONIK_Mens_Library_100.md.',
    '',
]
for ctx in ORDER:
    lines += ['---', '', f'## {ctx.upper()}', '']
    for l in by_ctx[ctx]:
        notes = l['notes']
        if l['shoes_default']:
            notes = (notes + ' ' if notes else '') + 'Footwear is not shown on the board; the default for this occasion is used.'
        lines += [
            f"**OUTFIT {200 + l['n']} — {ctx.upper()}**",
            f"SOURCE: Board look {l['n']} — {l['title']} — {l['pin']}",
            f"TOP: {clean(l['top'], 'Not shown')}",
            f"BOTTOM: {clean(l['bottom'], 'Not shown')}",
            f"LAYER: {clean(l['layer'], 'No layer')}",
            f"FOOTWEAR: {l['footwear']}",
            f"ACCESSORIES: {clean(l['acc'], 'None')}",
            f"STYLING: {notes}",
            f"ARCHETYPE: {l['sil']}",
            f"SILHOUETTE_FAMILY: {l['sil']}",
            'PRIORITY: board',
            '',
        ]
open(out, 'w').write('\n'.join(lines).rstrip() + '\n')

if '--report' in sys.argv:
    for ctx in ORDER:
        items = by_ctx[ctx]
        print(f'\n{ctx}: {len(items)}  silhouettes {dict(Counter(l["sil"] for l in items))}')
        for l in items:
            print(f'   {l["n"]:3d} {l["title"][:46]:46s} | {l["sil"]}{" | default shoes" if l["shoes_default"] else ""}')
