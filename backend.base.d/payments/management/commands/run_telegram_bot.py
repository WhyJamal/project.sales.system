from django.core.management.base import BaseCommand, CommandError
from django.conf import settings

from payments import telegram


class Command(BaseCommand):
    help = "Telegram bot for invoice top-ups (long polling, no public URL needed). Keep it running: service / pm2 / nssm."

    def handle(self, *args, **options):
        if not getattr(settings, "TELEGRAM_BOT_TOKEN", ""):
            raise CommandError("TELEGRAM_BOT_TOKEN is not set")
        self.stdout.write("Telegram bot started. Ctrl+C to stop.")
        telegram.poll_forever()
