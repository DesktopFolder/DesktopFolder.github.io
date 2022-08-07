. .env/bin/activate

function run_http() {
    python -m http.server 80
}

function watch_files() {
    while true; do
        inotifywait -e modify,create,delete,move -r src/ && \
        python templater.py
    done
}

trap 'kill 0' EXIT

run_http &
watch_files &
wait
