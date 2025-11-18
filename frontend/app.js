"use strict";

/*
  Ce fichier contient toute la logique côté navigateur :
  1. Récupérer la liste des équipements auprès de l'API FastAPI.
  2. Construire dynamiquement la bibliothèque (colonne de gauche).
  3. Permettre à l'utilisateur d'ajouter des blocs dans le bac à sable (colonne centrale).
*/

// L'URL de l'API. Garde-la à jour si tu modifies le port ou l'adresse du backend.
const API_URL = "http://127.0.0.1:8000/equipment";

// On récupère les éléments HTML une seule fois pour les réutiliser.
const equipmentListElement = document.getElementById("equipment-list");
const sandboxAreaElement = document.getElementById("sandbox-area");
const resetSandboxButton = document.getElementById("reset-sandbox");

// Identifiant du message affiché quand le bac à sable est vide (utile pour le manipuler facilement).
const SANDBOX_EMPTY_MESSAGE_ID = "sandbox-empty-message";
// Map qui nous permet de retrouver rapidement un bloc via son identifiant.
const equipmentById = new Map();
// Compteur utilisé pour gérer l'effet visuel lorsque l'utilisateur survole la zone de drop.
let sandboxDragDepth = 0;

// Cette fonction envoie une requête HTTP GET vers le backend pour obtenir les équipements.
async function fetchEquipment() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`La requête a échoué avec le statut ${response.status}`);
    }

    const data = await response.json();

    // Nous renvoyons la propriété "equipment" définie dans l'API.
    return data.equipment;
  } catch (error) {
    // Afficher l'erreur directement sur la page aide au débogage.
    displayError(error);
    return [];
  }
}

// Cette fonction affiche un message d'erreur visible par l'utilisateur.
function displayError(error) {
  const errorBox = document.createElement("div");
  errorBox.className = "equipment-card";
  errorBox.style.border = "1px solid #dc2626";
  errorBox.style.background = "#fee2e2";
  errorBox.innerHTML = `
    <h3>Erreur de chargement</h3>
    <p>${error.message}</p>
    <p>Vérifie que l'API FastAPI est bien démarrée avec uvicorn.</p>
  `;
  equipmentListElement.appendChild(errorBox);
}

// Affiche un message doux pour rappeler à l'utilisateur d'ajouter un bloc.
function showEmptySandboxMessage() {
  if (document.getElementById(SANDBOX_EMPTY_MESSAGE_ID)) {
    return;
  }

  const emptyMessage = document.createElement("p");
  emptyMessage.id = SANDBOX_EMPTY_MESSAGE_ID;
  emptyMessage.className = "sandbox-empty";
  emptyMessage.textContent =
    "Aucun bloc pour le moment. Glisse-dépose un élément de la bibliothèque (ou clique dessus) pour commencer.";

  sandboxAreaElement.appendChild(emptyMessage);
}

// Supprime le message d'aide si un bloc est ajouté.
function hideEmptySandboxMessage() {
  const emptyMessage = document.getElementById(SANDBOX_EMPTY_MESSAGE_ID);
  if (emptyMessage) {
    emptyMessage.remove();
  }
}

// Cette fonction crée la carte visuelle pour un bloc d'équipement.
function createEquipmentCard(block) {
  const card = document.createElement("article");
  card.className = "equipment-card";
  card.setAttribute("data-block-id", block.id);
  card.setAttribute("role", "listitem");
  card.tabIndex = 0;
  card.draggable = true;

  card.innerHTML = `
    <span class="equipment-category">${block.category}</span>
    <h3>${block.name}</h3>
    <p>${block.description}</p>
  `;

  // Lorsqu'on clique sur une carte, on l'ajoute au bac à sable.
  card.addEventListener("click", () => {
    addBlockToSandbox(block);
  });

  // Permettre l'ajout avec la touche Entrée ou Espace (accessibilité clavier).
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      addBlockToSandbox(block);
    }
  });

  // Gère le début du drag & drop : on stocke l'identifiant du bloc dans l'objet dataTransfer.
  card.addEventListener("dragstart", (event) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("text/plain", block.id);
    card.classList.add("dragging");
  });

  // Lorsque l'utilisateur relâche le bloc, on enlève l'effet visuel.
  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
  });

  return card;
}

// Ajoute un bloc visuel dans la zone d'expérimentation.
function addBlockToSandbox(block) {
  hideEmptySandboxMessage();

  const blockElement = document.createElement("div");
  blockElement.className = "sandbox-block";
  blockElement.setAttribute("role", "listitem");
  blockElement.setAttribute("data-block-id", block.id);

  const titleElement = document.createElement("strong");
  titleElement.textContent = block.name;

  const descriptionElement = document.createElement("p");
  descriptionElement.textContent = block.description;

  const removeButtonElement = document.createElement("button");
  removeButtonElement.type = "button";
  removeButtonElement.textContent = "Retirer";
  removeButtonElement.setAttribute(
    "aria-label",
    `Retirer ${block.name} du bac à sable`
  );

  removeButtonElement.addEventListener("click", () => {
    blockElement.remove();

    if (!sandboxAreaElement.querySelector(".sandbox-block")) {
      showEmptySandboxMessage();
    }
  });

  blockElement.appendChild(titleElement);
  blockElement.appendChild(descriptionElement);
  blockElement.appendChild(removeButtonElement);

  sandboxAreaElement.appendChild(blockElement);
}

// Fonction principale : elle charge les données et construit l'interface.
async function init() {
  const equipmentBlocks = await fetchEquipment();

  // Si aucun équipement n'a été récupéré (erreur), on arrête ici.
  if (!equipmentBlocks.length) {
    return;
  }

  equipmentBlocks.forEach((block) => {
    equipmentById.set(block.id, block);
    const card = createEquipmentCard(block);
    equipmentListElement.appendChild(card);
  });
}

// Configure les interactions au chargement du script.
function setupInteractions() {
  showEmptySandboxMessage();

  if (resetSandboxButton) {
    resetSandboxButton.addEventListener("click", () => {
      sandboxAreaElement.innerHTML = "";
      showEmptySandboxMessage();
    });
  }

  // Autoriser le drop : on empêche le comportement par défaut et on ajoute un feedback visuel.
  if (sandboxAreaElement) {
    sandboxAreaElement.addEventListener("dragenter", (event) => {
      event.preventDefault();
      sandboxDragDepth += 1;
      sandboxAreaElement.classList.add("drag-over");
    });

    sandboxAreaElement.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    });

    sandboxAreaElement.addEventListener("dragleave", () => {
      sandboxDragDepth = Math.max(0, sandboxDragDepth - 1);
      if (sandboxDragDepth === 0) {
        sandboxAreaElement.classList.remove("drag-over");
      }
    });

    sandboxAreaElement.addEventListener("drop", (event) => {
      event.preventDefault();
      sandboxDragDepth = 0;
      sandboxAreaElement.classList.remove("drag-over");

      const blockId = event.dataTransfer.getData("text/plain");
      if (!blockId) {
        return;
      }

      const block = equipmentById.get(blockId);
      if (!block) {
        return;
      }

      addBlockToSandbox(block);
      event.dataTransfer.clearData();
    });
  }
}

// On lance l'initialisation lorsque le script est chargé.
setupInteractions();
init();

