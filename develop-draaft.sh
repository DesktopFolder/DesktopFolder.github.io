#!/bin/bash

DRAAFTDIR="${DRAAFTDIR:-$HOME/programming/webdev/draaft/}"
if [ ! -d "${DRAAFTDIR}" ]; then
    echo "Error: ${DRAAFTDIR} does not exist. Set DRAAFTDIR to draaft server directory."
    exit 1
fi

sn="aadev"

if tmux has-session -t "$sn" >/dev/null 2>&1; then
    echo "Error: tmux session $sn already exists."
else
    # Create our main session, called aadev
    # Creates our first pane (:0), which is for server setup.
    tmux new-session -d -s "$sn"
    tmux rename-window -t "$sn":0 "servers"
    
    # (1) Launch the draaft server itself
    tmux send-keys -t "$sn" "cd ${DRAAFTDIR}; ./start.sh" C-m

    # (2) Launch the website
    tmux split-window -t "$sn"
    tmux send-keys -t "$sn" "pwd; ./start.sh" C-m

    # (3) Add the pane for the templater
    tmux split-window -t "$sn"
    tmux send-keys -t "$sn" ". .env/bin/activate" C-m
    tmux send-keys -t "$sn" "python3 templater.py" C-m

    # Create our second pane, drAAft.
    tmux new-window -t "$sn"
    tmux rename-window -t "$sn":1 "webserver"
    tmux send-keys -t "$sn" "cd ${DRAAFTDIR}" C-m

    # Create our third pane, github.io
    tmux new-window -t "$sn"
    tmux rename-window -t "$sn":1 "site"
fi
