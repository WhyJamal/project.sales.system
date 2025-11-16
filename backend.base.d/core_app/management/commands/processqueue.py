from django.core.management.base import BaseCommand
import time
from organizations.queue import load_queue, save_queue
from organizations.utils import update_1c_config

class Command(BaseCommand):
    help = "1C update queue worker"

    def handle(self, *args, **kwargs):
        self.stdout.write("Queue processor started...")

        while True:
            q = load_queue()

            if not q:
                time.sleep(3)
                continue

            item = q[0]
            path = item["path"]
            retry = item["retry"]

            result = update_1c_config(path)

            if result["success"]:
                q.pop(0)
            else:
                if retry >= 5:
                    q.pop(0)
                else:
                    item["retry"] += 1
                    q = q[1:] + [item]

            save_queue(q)
            time.sleep(3)
