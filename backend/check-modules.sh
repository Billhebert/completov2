#!/bin/bash

echo "Module | Index | Routes | README | Route Count"
echo "-------|-------|--------|--------|------------"

for dir in /home/user/completov2/backend/src/modules/*/; do
  module=$(basename "$dir")

  if [ -f "$dir/index.ts" ]; then
    has_index="YES"
  else
    has_index="NO"
  fi

  if [ -d "$dir/routes" ]; then
    has_routes="YES"
    route_count=$(find "$dir/routes" -name "*.route.ts" 2>/dev/null | wc -l)
  else
    has_routes="NO"
    route_count="0"
  fi

  if [ -f "$dir/README.md" ]; then
    has_readme="YES"
  else
    has_readme="NO"
  fi

  echo "$module | $has_index | $has_routes | $has_readme | $route_count"
done | sort
