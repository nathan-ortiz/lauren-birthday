import * as CANNON from 'cannon-es';

export function createPhysicsWorld() {
  const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0),
  });

  world.broadphase = new CANNON.SAPBroadphase(world);
  world.allowSleep = true;
  world.defaultContactMaterial.friction = 0.3;
  world.defaultContactMaterial.restitution = 0.2;

  // Ground
  const groundBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
  });
  groundBody.quaternion.setFromEulerAngles(-Math.PI / 2, 0, 0);
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
    body.quaternion.setFromEulerAngles(...rot);
    world.addBody(body);
  });

  return { world, groundBody };
}
