#!/bin/sh
# Suite de tests bout-en-bout (Playwright + Chromium requis : npm i -D playwright && npx playwright install chromium)
# Chaque test lance son propre serveur sur un port dédié ; les trois tournent en parallèle.
cd "$(dirname "$0")/.."; mkdir -p /tmp/msn-tests; head -c 300000 /dev/urandom > /tmp/msn-tests/test.bin
rc=0; i=0
for t in two-users three-users-group-game-call files-whiteboard-flags; do
  i=$((i+1)); port=$((8090+i))
  ( DATA_DIR=/tmp/msn-tests/d$i PORT=$port node server.js > /tmp/msn-tests/server$i.log 2>&1 & echo $! > /tmp/msn-tests/$i.pid; rm -rf /tmp/msn-tests/d$i
    sleep 1; PORT=$port node tests/$t.js > /tmp/msn-tests/$t.out 2>&1; echo $? > /tmp/msn-tests/$t.rc; kill $(cat /tmp/msn-tests/$i.pid) 2>/dev/null ) &
done
wait
for t in two-users three-users-group-game-call files-whiteboard-flags; do echo "== $t (rc=$(cat /tmp/msn-tests/$t.rc))"; tail -2 /tmp/msn-tests/$t.out; [ "$(cat /tmp/msn-tests/$t.rc)" = 0 ] || rc=1; done
exit $rc
