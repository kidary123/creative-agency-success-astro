#!/usr/bin/env bash
# Repositorio en GitHub + despliegue en Vercel, de una sola pasada.
#   bash scripts/setup-git-vercel.sh <nombre-repo> [--publico|--privado]
set -euo pipefail

REPO="${1:?Falta el nombre del repositorio}"
VISIBILIDAD="--private"
[[ "${2:-}" == "--publico" ]] && VISIBILIDAD="--public"

paro() { echo -e "\n✖ $1\n  → $2\n" >&2; exit 1; }

command -v gh >/dev/null     || paro "Falta GitHub CLI" "instala gh y corre: gh auth login"
command -v vercel >/dev/null || paro "Falta Vercel CLI" "npm i -g vercel && vercel login"
gh auth status >/dev/null 2>&1 || paro "GitHub sin autenticar" "gh auth login"
vercel whoami   >/dev/null 2>&1 || paro "Vercel sin autenticar" "vercel login  (o LOGIN-VERCEL.bat)"

# .gitignore — public/assets/originales/ pesa decenas de MB y se regenera desde Figma.
# .optimized.json SÍ se versiona: sin él, el siguiente clon re-optimiza y degrada los WebP.
if [[ ! -f .gitignore ]]; then
  cat > .gitignore <<'EOF'
node_modules/
dist/
.vercel/
.verificacion/
.figma-ref/
public/assets/originales/
.DS_Store
EOF
fi

[[ -d .git ]] || git init -q
git add -A
git diff --cached --quiet || git commit -q -m "Reconstrucción del diseño de Figma en Astro"

if gh repo view "$REPO" >/dev/null 2>&1; then
  echo "El repo ya existe; añado el remote y empujo."
  URL_REPO=$(gh repo view "$REPO" --json url -q .url)
  git remote get-url origin >/dev/null 2>&1 || git remote add origin "$URL_REPO.git"
  git branch -M main
  git push -u origin main
else
  gh repo create "$REPO" "$VISIBILIDAD" --source=. --remote=origin --push
  URL_REPO=$(gh repo view "$REPO" --json url -q .url)
fi

vercel link --yes >/dev/null
URL_PROD=$(vercel --prod --yes | tail -n1)

echo
echo "Repositorio: $URL_REPO"
echo "Producción:  $URL_PROD"
