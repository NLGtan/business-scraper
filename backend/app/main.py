from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import enrich, export, search
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_origin_regex=settings.backend_cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router, prefix=settings.api_prefix, tags=["search"])
app.include_router(enrich.router, prefix=settings.api_prefix, tags=["enrichment"])
app.include_router(export.router, prefix=settings.api_prefix, tags=["export"])


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}

