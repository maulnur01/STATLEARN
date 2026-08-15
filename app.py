"""
Statlearn — server statis sederhana.

CATATAN PENTING:
Fitur "Tanya AI" TIDAK LAGI memakai server ini. Sejak revisi ini, permintaan
ke Groq dikirim LANGSUNG dari browser pengguna (lihat script.js), memakai
API key Groq pribadi yang dimasukkan pengguna sendiri di menu ⚙️ pada
halaman Tanya AI. Artinya:
  - Tidak perlu GROQ_API_KEY / file .env sama sekali.
  - Tidak perlu server ini berjalan untuk memakai fitur Tanya AI — bahkan
    index.html/style.css/script.js bisa dibuka langsung sebagai file statis
    (double click index.html) atau di-hosting di static hosting apa pun
    (GitHub Pages, Netlify, dll).

Server Flask ini hanya disediakan sebagai cara opsional untuk menjalankan
seluruh website (semua halaman) lewat satu perintah "python app.py" saat
development lokal.
"""

import os
from flask import Flask, send_from_directory, abort

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=BASE_DIR, static_url_path="")


@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    # Hanya izinkan file statis yang memang ada di folder proyek.
    full_path = os.path.join(BASE_DIR, filename)
    if os.path.isfile(full_path):
        return send_from_directory(BASE_DIR, filename)
    abort(404)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    print(f"Statlearn berjalan di http://localhost:{port}")
    print("Tanya AI berjalan langsung dari browser ke Groq (tidak butuh key di server ini).")
    app.run(host="0.0.0.0", port=port, debug=debug)