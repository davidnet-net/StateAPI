#!/bin/bash
SESSION_NAME="StateAPI"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir" || exit 1
echo "ENV-Path setup [ok]"

if screen -list | grep -q "$SESSION_NAME"; then
  echo "Terminating old $SESSION_NAME."
  screen -S "$SESSION_NAME" -X quit
  echo "Terminated."
fi

echo "Updating depedencies!"
sudo apt update && sudo apt install acpi speedtest-cli screen
npm install
echo "Finished updating depedencies!"

echo "Starting $SESSION_NAME!"
screen -dmS "$SESSION_NAME" npm start
echo "Started!"
