from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/system")
def system():
    return jsonify({
        "cpu": 42,
        "ram": 61,
        "online": True
    })

if __name__ == "__main__":
    app.run(debug=True)