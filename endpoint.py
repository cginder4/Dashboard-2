from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/server")
def server():
    return jsonify({
        "cpu": 45,
        "gpu": 65,
        "jellyfin_status": "Running"
    })

if __name__ == "__main__":
    app.run(debug=True)
