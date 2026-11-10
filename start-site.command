#!/bin/zsh
cd "$(dirname "$0")"
echo ""
echo "Сайт запущен: http://localhost:8765"
echo "Браузер откроется сам. Чтобы остановить сервер — нажми Ctrl+C."
echo ""
python3 -m http.server 8765 &
server_pid=$!
sleep 1
open "http://localhost:8765"
wait $server_pid
