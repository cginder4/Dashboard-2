import requests
from flask import Flask, jsonify
from flask_cors import CORS
import psutil

def get_cpu_stats():
    return psutil.cpu_percent(interval=1)

def get_ram_stats():
    return psutil.virtual_memory(interval=1).percent

def get_jellyfin_status():
    http_response = requests.get("http://localhost:8096/health")
    if http_response.status_code == 200:
        return "online"
    return "offline"

app = Flask(__name__)
CORS(app)

@app.route("/server_stats")
def server_stats():
    stats ={
        "cpu": get_cpu_stats(),
        "ram": get_ram_stats(),
        "jellyfin_status": get_jellyfin_status()
    }
    return stats

def stats_jsonify():
    return jsonify(server_stats())

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000,debug=True)
