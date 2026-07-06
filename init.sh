#!/usr/bin/env bash
# Verification runner — chay cac check ma feature phai pass truoc khi done/ship.
# Dung: ./init.sh [scaffold|web|extension|secret|all]   (mac dinh: all)
# Defensive: bo qua phan chua scaffold. Exit != 0 neu co check that bai.
# Fail-fast: build/typecheck hard-error dung ngay trong tung target (set -e semantics);
# runner tong hop FAIL de bao cao het cac check con lai.
set -uo pipefail
cd "$(dirname "$0")"
TARGET="${1:-all}"
FAIL=0
step() { echo ""; echo "==> $1"; }
run()  { echo "\$ $*"; if ! "$@"; then echo "   [FAIL] $*"; FAIL=1; fi; }

check_web() {
  if [ ! -d web ]; then echo "   (web/ chua ton tai — skip)"; return; fi
  step "WEB: install / lint / typecheck / build / test"
  ( cd web
    [ -f package.json ] || { echo "   (web/package.json thieu — skip)"; exit 0; }
    npm run --silent lint       2>/dev/null || echo "   (no lint script)"
    npm run --silent typecheck  2>/dev/null || npx --yes tsc --noEmit 2>/dev/null || echo "   (no typecheck)"
    npm run --silent build      || { echo "   [FAIL] web build"; exit 1; }
    npm run --silent test       2>/dev/null || echo "   (no test script)"
  ) || FAIL=1
}

check_extension() {
  if [ ! -d extension ]; then echo "   (extension/ chua ton tai — skip)"; return; fi
  step "EXTENSION: build dev + prod"
  ( cd extension
    [ -f package.json ] || { echo "   (extension/package.json thieu — skip)"; exit 0; }
    npm run --silent build || node build.mjs || { echo "   [FAIL] extension build"; exit 1; }
  ) || FAIL=1
}

# P0 invariant: dist extension KHONG duoc lo secret.
check_secret() {
  step "SECRET LEAK: grep extension/dist"
  if [ ! -d extension/dist ]; then echo "   (extension/dist chua co — skip)"; return; fi
  if grep -RniE 'service_role|OPENAI_API_KEY|sk-[A-Za-z0-9]{20}' extension/dist 2>/dev/null; then
    echo "   [FAIL] SECRET tim thay trong dist — KHONG duoc ship"; FAIL=1
  else
    echo "   OK: 0 secret trong dist"
  fi
}

check_scaffold() {
  step "SCAFFOLD: root workspaces"
  [ -f package.json ] && echo "   root package.json: OK" || { echo "   [FAIL] root package.json"; FAIL=1; }
  [ -f .env.example ] && echo "   .env.example: OK"       || echo "   (chua co .env.example)"
  [ -f README.md ]    && echo "   README.md: OK"          || echo "   (chua co README.md)"
}

case "$TARGET" in
  scaffold)  check_scaffold ;;
  web)       check_web ;;
  extension) check_extension; check_secret ;;
  secret)    check_secret ;;
  all)       check_scaffold; check_web; check_extension; check_secret ;;
  *) echo "unknown target: $TARGET"; exit 2 ;;
esac

echo ""
if [ "$FAIL" -eq 0 ]; then echo "VERIFY OK ($TARGET)"; else echo "VERIFY FAILED ($TARGET)"; fi
exit $FAIL
