#!/bin/bash
#
# Run the complete data pipeline for HRA + CNS analytics dashboard.
#
# Usage:
#   ./data_processing/run_all.sh              # Run everything
#   ./data_processing/run_all.sh --hra-only   # HRA pipeline only
#   ./data_processing/run_all.sh --cns-only   # CNS pipeline only
#   ./data_processing/run_all.sh --skip-fetch  # Skip PubMed/GitHub fetches (use cached data)
#
# Prerequisites:
#   pip install -r data_processing/requirements.txt
#   gh auth login  (for GitHub API access)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Parse args
RUN_HRA=true
RUN_CNS=true
SKIP_FETCH=false

for arg in "$@"; do
  case $arg in
    --hra-only)  RUN_CNS=false ;;
    --cns-only)  RUN_HRA=false ;;
    --skip-fetch) SKIP_FETCH=true ;;
  esac
done

echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  HRA + CNS Analytics — Data Pipeline${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

START_TIME=$(date +%s)

# ── Auto-detect latest parquet files ──────────────────────────────────────────
HRA_PARQUET=$(ls -t data/hra/*hra-logs*.parquet 2>/dev/null | head -1)
CNS_PARQUET=$(ls -t data/cns/*cns-logs*.parquet 2>/dev/null | head -1)

if [ "$RUN_HRA" = true ] && [ -z "$HRA_PARQUET" ]; then
  echo -e "${YELLOW}Warning: No HRA parquet found in data/hra/ — skipping HRA${NC}"
  RUN_HRA=false
fi
if [ "$RUN_CNS" = true ] && [ -z "$CNS_PARQUET" ]; then
  echo -e "${YELLOW}Warning: No CNS parquet found in data/cns/ — skipping CNS${NC}"
  RUN_CNS=false
fi

[ -n "$HRA_PARQUET" ] && echo -e "  HRA parquet: ${GREEN}${HRA_PARQUET}${NC}"
[ -n "$CNS_PARQUET" ] && echo -e "  CNS parquet: ${GREEN}${CNS_PARQUET}${NC}"
echo ""

# ── HRA Pipeline ──────────────────────────────────────────────────────────────
if [ "$RUN_HRA" = true ]; then
  echo -e "${GREEN}[1/6] HRA: Generating aggregation data...${NC}"
  python data_processing/generate_hra_data.py --parquet "$HRA_PARQUET"
  echo ""

  echo -e "${GREEN}[2/6] HRA: Running ML pipeline...${NC}"
  python data_processing/generate_hra_ml_insights.py --input-parquet "$HRA_PARQUET"
  echo ""

  if [ "$SKIP_FETCH" = false ]; then
    echo -e "${GREEN}[3/6] HRA: Fetching publications from PubMed...${NC}"
    python data_processing/fetch_hra_publications.py
    echo ""
  else
    echo -e "${YELLOW}[3/6] HRA: Skipping PubMed fetch (--skip-fetch)${NC}"
    echo ""
  fi
else
  echo -e "${YELLOW}[1-3] HRA: Skipped (--cns-only)${NC}"
  echo ""
fi

# ── CNS Pipeline ──────────────────────────────────────────────────────────────
if [ "$RUN_CNS" = true ]; then
  echo -e "${GREEN}[4/6] CNS: Generating aggregation data...${NC}"
  python data_processing/generate_cns_data.py --parquet "$CNS_PARQUET"
  echo ""

  if [ "$SKIP_FETCH" = false ]; then
    echo -e "${GREEN}[5/6] CNS: Fetching publications, events, funding, news from GitHub...${NC}"
    python data_processing/fetch_cns_github.py
    echo ""
  else
    echo -e "${YELLOW}[5/6] CNS: Skipping GitHub fetch (--skip-fetch)${NC}"
    echo ""
  fi
else
  echo -e "${YELLOW}[4-5] CNS: Skipped (--hra-only)${NC}"
  echo ""
fi

# ── Build ─────────────────────────────────────────────────────────────────────
echo -e "${GREEN}[6/6] Building Next.js...${NC}"
npx next build

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Pipeline complete in ${ELAPSED}s${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""
echo "  HRA data: public/data/hra/"
echo "  CNS data: public/data/cns/"
echo ""
echo "  Run 'npm run dev' to preview."
