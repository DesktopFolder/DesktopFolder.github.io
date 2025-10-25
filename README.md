Custom HTML website.

Might have to add dhtml files to templater..?

## How to Build and Run

> [!IMPORTANT]
> If you are on Windows, you must run the templater using WSL (Windows Subsystem for Linux).

1. **Install dependencies:**

    - Make sure you have Python 3 installed.
    - (Recommended) Use a virtual environment for Python:
        ```bash
        python3 -m venv .venv
        source .venv/bin/activate
        pip install -r requirements.txt
        ```
    - Install TypeScript (if not already):
        ```bash
        npm install -g typescript
        ```

2. **Generate the site (this also compiles TypeScript):**

    ```bash
    python3 templater.py
    ```

3. **Serve the site locally:**
    - From the `docs` directory, run:
        ```bash
        python3 -m http.server 8080
        ```
    - Then open [http://localhost:8080](http://localhost:8080) in your browser.

---

-   Generated HTML will appear in the `docs/` directory, mirroring the structure of your `src/` files.
-   Edit `.dhtml` files in `src/`, then re-run the templater to update the site.
