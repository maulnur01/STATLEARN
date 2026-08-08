import os
import requests
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()  # baca file .env di folder yang sama

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "").strip()
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=BASE_DIR, static_url_path="")
CORS(app)

SYSTEM_PROMPT = (
    "Kamu adalah tutor statistika yang ramah untuk siswa SMP kelas VIII di Indonesia, "
    "bagian dari aplikasi belajar bernama Statlearn. Topik utama: penyajian data "
    "(tabel, diagram batang, diagram garis, diagram lingkaran) dan ukuran pemusatan "
    "data (mean, median, modus), termasuk konsep outlier. "
    "Jawab dalam Bahasa Indonesia yang sederhana dan mudah dipahami siswa SMP, "
    "gunakan contoh sehari-hari bila membantu, dan jangan bertele-tele — "
    "usahakan jawaban singkat (maksimal sekitar 120 kata) kecuali diminta lebih detail. "
    "Jika pertanyaan di luar topik matematika/statistika/STEM, tetap jawab dengan sopan "
    "dan arahkan kembali ke topik pelajaran bila relevan."
)


# ---------- ROUTES: FILE STATIS ----------
@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    # Hanya izinkan file statis yang memang ada di folder proyek
    full_path = os.path.join(BASE_DIR, filename)
    if os.path.isfile(full_path):
        return send_from_directory(BASE_DIR, filename)
    return jsonify({"error": "File tidak ditemukan"}), 404


# ---------- ROUTES: API ----------
@app.route("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "groq_configured": bool(GROQ_API_KEY)
    })


@app.route("/api/ask", methods=["POST"])
def ask():
    payload = request.get_json(silent=True) or {}
    question = (payload.get("question") or "").strip()

    if not question:
        return jsonify({"error": "Pertanyaan tidak boleh kosong."}), 400

    if len(question) > 1000:
        return jsonify({"error": "Pertanyaan terlalu panjang, maksimal 1000 karakter."}), 400

    # Key pribadi dari menu "Pengaturan API Key" di frontend (disimpan di browser
    # pengguna, dikirim per-permintaan) dipakai lebih dulu jika ada. Kalau tidak,
    # pakai GROQ_API_KEY dari .env di server.
    client_key = (
        request.headers.get("X-Groq-Key")
        or (payload.get("api_key") or "")
    ).strip()
    active_key = client_key or GROQ_API_KEY

    if not active_key:
        return jsonify({
            "error": "Belum ada Groq API key. Isi GROQ_API_KEY di .env server, atau klik ikon gerigi "
                     "di menu Tanya AI untuk memakai API key pribadimu.",
            "needs_key": True
        }), 503

    if client_key and not client_key.startswith("gsk_"):
        return jsonify({"error": "Format API key tidak valid (harus diawali 'gsk_')."}), 400

    try:
        response = requests.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {active_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": question},
                ],
                "temperature": 0.5,
                "max_tokens": 500,
            },
            timeout=30,
        )
    except requests.exceptions.RequestException as exc:
        return jsonify({"error": f"Gagal menghubungi Groq API: {exc}"}), 502

    if response.status_code == 401:
        return jsonify({
            "error": "Groq API menolak API key ini (tidak valid/kedaluwarsa). Klik ikon gerigi di menu "
                     "Tanya AI untuk memasukkan API key yang benar.",
            "needs_key": True
        }), 401

    if response.status_code != 200:
        detail = response.text[:300]
        return jsonify({"error": f"Groq API mengembalikan error ({response.status_code}): {detail}"}), 502

    data = response.json()
    try:
        answer = data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError):
        return jsonify({"error": "Format respons dari Groq tidak dikenali."}), 502

    return jsonify({"answer": answer})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    print(f"Statlearn berjalan di http://localhost:{port}")
    if not GROQ_API_KEY:
        print("⚠  GROQ_API_KEY belum diisi di .env — Tanya AI akan mengembalikan error 503 "
              "dan frontend otomatis memakai jawaban cadangan offline.")
    app.run(host="0.0.0.0", port=port, debug=debug)