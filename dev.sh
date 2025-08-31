. .env/bin/activate

function run_http() {
    cd docs/
    python -m http.server 80
}

function watch_files() {
    while true; do
        fswatch -o ./src ./assets ./styles/ ./styles.css ./templates/ | xargs -n1 -I{} ./gen.sh
    done
}

trap 'kill 0' EXIT

run_http &
watch_files &
wait
