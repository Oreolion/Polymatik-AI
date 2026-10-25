"""Explicit loopback-only launcher; imports do not start a service."""

import argparse
import logging

import uvicorn


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the local Polymatik agent baseline")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    if not 0 <= args.port <= 65535:
        parser.error("port must be between 0 and 65535")
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    uvicorn.run(
        "polymatik_agent.app:create_app",
        factory=True,
        host="127.0.0.1",
        port=args.port,
        log_config=None,
        # Uvicorn's default access log includes raw query strings. Use app metadata logs.
        access_log=False,
    )


if __name__ == "__main__":
    main()
