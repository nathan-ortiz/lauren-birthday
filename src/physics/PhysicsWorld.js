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
    { pos: [half, wallHeight, 0], rot: [0, Math.PI / 2, 0] },
    { pos: [-half, wallHeight, 0], rot: [0, Math.PI / 2, 0] },
  ];
  const wallShape = new CANNON.Box(new CANNON.Vec3(half, wallHeight, wallThickness));
  walls.forEach(({ pos, rot }) => {
    const body = new CANNON.Body({ type: CANNON.Body.STATIC, shape: wallShape });
    body.position.set(...pos);
    body.quaternion.setFromEuler(...rot);
    world.addBody(body);
  });

  return { world, groundBody, carMaterial };
}
