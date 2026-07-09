from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/server_stats")
def server():
    return jsonify({
        "cpu": "45",
        "gpu": "65",
        "jellyfin_status": "online"
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000,debug=True)
