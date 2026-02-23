#!/bin/sh
cat <<EOF > /usr/share/nginx/html/env-config.js
window.env = {
  VITE_BASE_URL: "${VITE_BASE_URL:-/api}"
};
EOF
