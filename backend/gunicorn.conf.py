import multiprocessing
import os

bind = "0.0.0.0:8000"
workers = int(os.getenv("WEB_CONCURRENCY", str(max(2, multiprocessing.cpu_count() * 2 + 1))))
worker_class = "uvicorn.workers.UvicornWorker"
timeout = int(os.getenv("REQUEST_TIMEOUT_SECONDS", "90"))
keepalive = 5
accesslog = "-"
errorlog = "-"
loglevel = os.getenv("LOG_LEVEL", "info")
preload_app = False
