import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.endpoints import target, export, node, chat

app = FastAPI(title="NexusOSINT API", version="0.1.0")

# Frontend'in API'ye erişebilmesi için CORS ayarları
# GÜVENLİK: allow_origins=["*"] + allow_credentials=True, ziyaret edilen HERHANGİ bir web
# sitesinin kullanıcının tarayıcısı üzerinden bu API'ye tarama başlatmasına izin veriyordu.
# İzinli kökenler artık ortam değişkeninden okunur (virgülle ayrılmış liste).
ALLOWED_ORIGINS = [
    o.strip() for o in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",") if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,  # Kimlik çerezi kullanılmıyor
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# Yazdığımız Router'ları sisteme dahil ediyoruz
app.include_router(target.router, prefix="/api/targets", tags=["Targets"])
app.include_router(export.router, prefix="/api/export", tags=["Export"])
app.include_router(node.router, prefix="/api/nodes", tags=["Nodes"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])

@app.get("/")
async def root():
    return {"message": "NexusOSINT API is running. Check /docs for documentation."}