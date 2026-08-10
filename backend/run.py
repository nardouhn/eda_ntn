from __future__ import annotations

import asyncio
import os
import sys

import uvicorn
from dotenv import load_dotenv


if __name__ == "__main__":
    load_dotenv()
    config = uvicorn.Config(
        app="app.main:app",
        host=os.getenv("API_HOST", "127.0.0.1"),
        port=int(os.getenv("API_PORT", "8000")),
        reload=os.getenv("API_RELOAD", "false").lower() == "true",
    )
    server = uvicorn.Server(config)
    if sys.platform == "win32":
        loop = asyncio.SelectorEventLoop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(server.serve())
        finally:
            loop.close()
    else:
        asyncio.run(server.serve())
