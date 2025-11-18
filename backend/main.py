"""FastAPI application exposing the equipment library for the energy simulator POC.

This first step focuses only on returning a static list of blocks so that
we can validate the project structure and the communication between backend
and (future) frontend components.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Instantiate the FastAPI application. "app" is the conventional name used by ASGI servers.
app = FastAPI(
    title="Energy Simulator POC",
    description="Minimal API returning the available equipment blocks.",
    version="0.1.0",
)

# Allow local web pages (e.g., a simple frontend served via file:// or localhost) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In a local POC we can allow everything. We'll restrict later if needed.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/equipment", tags=["equipment"])
async def list_equipment() -> dict:
    """Return the catalog of equipment blocks available in the simulator.

    In future iterations we can enrich this data (database, categories, etc.).
    For now we keep a static list so that the frontend can already consume it.
    """

    equipment_blocks = [
        {
            "id": "cogenerator",
            "name": "Cogénérateur",
            "description": "Produit simultanément chaleur et électricité pour améliorer l'efficacité énergétique.",
            "category": "Thermique",
        },
        {
            "id": "turbo",
            "name": "Turbo",
            "description": "Augmente la pression d'un fluide pour améliorer les performances des machines.",
            "category": "Mécanique",
        },
        {
            "id": "heat_pump",
            "name": "Pompe à chaleur",
            "description": "Transfère l'énergie thermique d'un milieu à un autre pour chauffer ou refroidir l'installation.",
            "category": "Thermique",
        },
        {
            "id": "tower_niro",
            "name": "Tour Niro",
            "description": "Assure le refroidissement des fluides de procédé via un échange avec l'air extérieur.",
            "category": "Refroidissement",
        },
    ]

    return {"equipment": equipment_blocks}


