#!/usr/bin/env python3
"""Convierte los originales a WebP de forma IDEMPOTENTE.

WebP tiene pérdida. Si este script corriera sobre su propia salida, cada pasada
degradaría la imagen de forma acumulativa e irreversible. Por eso lleva un
registro por hash en .optimized.json y salta lo ya hecho.

No borres el registro para "empezar limpio": borra los WebP de salida Y el
registro juntos, o no borres ninguno.
"""
import hashlib
import json
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Falta Pillow.  pip install Pillow --break-system-packages")

RAIZ = Path.cwd()
ORIGINALES = RAIZ / "public" / "assets" / "originales"
SALIDA = RAIZ / "public" / "assets"
REGISTRO = RAIZ / ".optimized.json"
CALIDAD = 82
ANCHO_MAX = 2400
EXTENSIONES = {".png", ".jpg", ".jpeg", ".webp"}


def hash_archivo(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for bloque in iter(lambda: f.read(65536), b""):
            h.update(bloque)
    return h.hexdigest()[:16]


def main() -> int:
    if not ORIGINALES.is_dir():
        sys.exit(f"No existe {ORIGINALES}. Corre antes: node scripts/get-assets.mjs")

    registro = json.loads(REGISTRO.read_text()) if REGISTRO.exists() else {}
    SALIDA.mkdir(parents=True, exist_ok=True)

    hechos = saltados = 0
    for origen in sorted(ORIGINALES.rglob("*")):
        if not origen.is_file() or origen.suffix.lower() not in EXTENSIONES:
            continue

        rel = origen.relative_to(ORIGINALES)
        destino = SALIDA / rel.with_suffix(".webp")
        clave = str(rel).replace("\\", "/")
        firma = hash_archivo(origen)

        if registro.get(clave) == firma and destino.exists():
            saltados += 1
            continue

        destino.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(origen) as im:
            im = im.convert("RGBA") if im.mode in ("P", "LA") else im
            if im.width > ANCHO_MAX:
                alto = round(im.height * ANCHO_MAX / im.width)
                im = im.resize((ANCHO_MAX, alto), Image.LANCZOS)
            im.save(destino, "WEBP", quality=CALIDAD, method=6)

        registro[clave] = firma
        hechos += 1
        ahorro = 1 - destino.stat().st_size / origen.stat().st_size
        print(f"  {clave} → {destino.name}  (-{ahorro:.0%})")

    REGISTRO.write_text(json.dumps(registro, indent=2, ensure_ascii=False))
    print(f"\nOptimizadas {hechos}, ya estaban {saltados}. Registro: .optimized.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
