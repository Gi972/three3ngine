// Création d'entités
let nextEntityId = 0;
function createEntity() {
  return {
    id: nextEntityId++,
    components: {}
  };
}

// Gestion des composants
function addComponent(entity, componentName, componentData) {
  entity.components[componentName] = componentData;
  return entity;
}

function removeComponent(entity, componentName) {
  delete entity.components[componentName];
  return entity;
}

function getComponent(entity, componentName) {
  return entity.components[componentName];
}

// Création du monde
function createWorld() {
  return {
    entities: {},
    systems: []
  };
}

// Gestion des entités dans le monde
function addEntity(world, entity) {
  world.entities[entity.id] = entity;
}

function removeEntity(world, entityId) {
  delete world.entities[entityId];
}

// Gestion des systèmes
function addSystem(world, system) {
  world.systems.push(system);
}

// Mise à jour du monde
function updateWorld(world, deltaTime) {
  for (let system of world.systems) {
    system(world, deltaTime);
  }
}

// Exemple de composants
const createPositionComponent = (x = 0, y = 0) => ({ x, y });
const createVelocityComponent = (vx = 0, vy = 0) => ({ vx, vy });

// Exemple de système
const movementSystem = (world, deltaTime) => {
  for (let entityId in world.entities) {
    const entity = world.entities[entityId];
    const position = getComponent(entity, 'position');
    const velocity = getComponent(entity, 'velocity');
    
    if (position && velocity) {
      position.x += velocity.vx * deltaTime;
      position.y += velocity.vy * deltaTime;
    }
  }
};

// Utilisation
const world = createWorld();

// Création d'entités
const player = createEntity();
addComponent(player, 'position', createPositionComponent(0, 0));
addComponent(player, 'velocity', createVelocityComponent(1, 1));
addEntity(world, player);

const obstacle = createEntity();
addComponent(obstacle, 'position', createPositionComponent(5, 5));
addEntity(world, obstacle);

// Ajout du système au monde
addSystem(world, movementSystem);

// Fonction de boucle de jeu simulée
function gameLoop(deltaTime) {
  updateWorld(world, deltaTime);

  // Affichage des positions (pour démonstration)
  for (let entityId in world.entities) {
    const entity = world.entities[entityId];
    const position = getComponent(entity, 'position');
    if (position) {
      console.log(`Entity ${entityId} position: (${position.x}, ${position.y})`);
    }
  }
}

// Simulation de quelques mises à jour
console.log("Initial state:");
gameLoop(0);

console.log("\nAfter 1 second:");
gameLoop(1);

console.log("\nAfter 2 seconds:");
gameLoop(1);
