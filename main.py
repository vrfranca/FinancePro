
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

app = FastAPI(title="FinancePro API")

# Servir arquivos estáticos (HTML, JS, CSS)
# Certifique-se de que os arquivos estão na mesma pasta
app.mount("/static", StaticFiles(directory="."), name="static")

@app.get("/")
async def read_index():
    return FileResponse('index.html')

@app.get("/{path:path}")
async def serve_all(path: str):
    # Se o arquivo existir localmente, serve ele
    if os.path.exists(path):
        return FileResponse(path)
    # Caso contrário, retorna o index (para suporte a rotas de SPA se houver)
    return FileResponse('index.html')

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
