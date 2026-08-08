from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/assets/backgrounds/appointments-court-clean-v2.png"
OUTPUT = ROOT / "public/assets/decorations"


def masked_layer(
    name: str,
    polygons: list[list[tuple[int, int]]],
    ellipses: list[tuple[int, int, int, int]] = [],
    patches: list[tuple[tuple[int, int, int, int], tuple[int, int]]] = [],
) -> None:
    source = Image.open(SOURCE).convert("RGBA")
    for source_box, destination in patches:
        source.paste(source.crop(source_box), destination)
    scale = 4
    mask = Image.new("L", (source.width * scale, source.height * scale), 0)
    draw = ImageDraw.Draw(mask)
    for polygon in polygons:
        draw.polygon([(x * scale, y * scale) for x, y in polygon], fill=255)
    for bounds in ellipses:
        draw.ellipse(tuple(value * scale for value in bounds), fill=255)
    mask = mask.resize(source.size, Image.Resampling.LANCZOS)
    layer = Image.new("RGBA", source.size, (0, 0, 0, 0))
    layer.paste(source, (0, 0), mask)
    layer.save(OUTPUT / name, optimize=True)


masked_layer(
    "appointment-roster-panel-v4.png",
    [
        [(1120, 74), (1620, 113), (1575, 619), (1064, 572)],
        [(1282, 89), (1425, 101), (1420, 153), (1278, 140)],
        [(1065, 414), (1111, 414), (1120, 480), (1061, 492), (1052, 453)],
    ],
    patches=[((1158, 260, 1182, 316), (1162, 203))],
)

masked_layer(
    "appointment-assign-panel-v3.png",
    [[(1090, 550), (1573, 594), (1531, 850), (1057, 807)]],
    [(1478, 740, 1614, 879)],
)
