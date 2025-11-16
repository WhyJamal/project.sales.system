import json, os

QUEUE_FILE = "update_queue.json"

def load_queue():
    if not os.path.exists(QUEUE_FILE):
        return []
    return json.load(open(QUEUE_FILE, "r"))

def save_queue(q):
    json.dump(q, open(QUEUE_FILE, "w"))

def add_to_queue(path):
    q = load_queue()
    q.append({"path": path, "retry": 0})
    save_queue(q)
