from django.core.management.base import BaseCommand

from payments.invoices import expire_stale


class Command(BaseCommand):
    help = "Cancel invoice requests that were never paid (created / sent for INVOICE_EXPIRE_DAYS days). Signed ones are never touched. Run daily."

    def add_arguments(self, parser):
        parser.add_argument("--days", type=int, default=None)

    def handle(self, *args, **options):
        n = expire_stale(options["days"])
        self.stdout.write(f"Cancelled: {n}")
