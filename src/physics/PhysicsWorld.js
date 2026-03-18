import * as CANNON from 'cannon-es';

export function createPhysicsWorld() {
  const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0),
  });

  world.broadphase = new CANNON.SAPBroadphase(world);
  world.allowSleep = true;
  world.defaultContactMaterial.friction = 0.3;
  world.defaultContactMaterial.restitution = 0.2;

  // Materials
  const groundMaterial = new CANNON.Material('ground');
  const carMaterial = new CANNON.Material('car');

  // Car slides freely on ground — zero friction so velocity changes actually work
  const carGroundContact = new CANNON.ContactMaterial(groundMaterial, carMaterial, {
    friction: 0.0,
    restitution: 0.1,
  });
  world.addContactMaterial(carGroundContact);

  // Ground
  const groundBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
    material: groundMaterial,
  });
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(groundBody);

  // Boundary walls
  const half = 60;
  const wallThickness = 0.5;
  const wallHeight = 10;
  const walls = [
    { pos: [0, wallHeight, half], rot: [0, 0, 0] },
    { pos: [0, wallHeight, -half], rot: [0, 0, 0] },
    { pos: [-half, wallHeight, 0], rot: [0, Math.PI / 2, 0] },
    // East wall split below — gap for waterfall cave entrance
  ];
  const wallShape = new CANNON.Box(new CANNON.Vec3(half, wallHeight, wallThickness));
  walls.forEach(({ pos, rot }) => {
    const body = new CANNON.Body({ type: CANNON.Body.STATIC, shape: wallShape });
    body.position.set(...pos);
    body.quaternion.setFromEuler(...rot);
    world.addBody(body);
  });

  // East wall — split for waterfall cave canyon (gap z=5 to z=49)
  const eastSouth = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Box(new CANNON.Vec3(wallThickness, wallHeight, 32.5)),
  });
  eastSouth.position.set(half, wallHeight, -27.5); // covers z=-60 to z=5
  world.addBody(eastSouth);

  const eastNorth = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Box(new CANNON.Vec3(wallThickness, wallHeight, 5.5)),
  });
  eastNorth.position.set(half, wallHeight, 54.5); // covers z=49 to z=60
  world.addBody(eastNorth);

  return { world, groundBody, carMaterial };
}
