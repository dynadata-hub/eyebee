#!/bin/bash
ENDPOINT=${1:-http://192.168.0.200}
while true; do
curl -s $ENDPOINT/videocall/api/peers > peers.json;
sleep 5;
done