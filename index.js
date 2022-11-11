import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useLoaders, usePhysics, useCleanup} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

export default () => {
  const app = useApp();
  const physics = usePhysics();

  let animations = [];
  let mixer = null;
  let clips = null;

  app.name = 'dummy';

  app.addEventListener('hit', e => {
    _playAnimation();
  });

  const _playAnimation = () => {
    if(clips && mixer) {
      mixer.stopAllAction();
      const randomIndex = Math.floor(Math.random() * clips.length);
      let action = mixer.clipAction( clips[randomIndex] );
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      action.play();
    }
  }

  let physicsId = null;
  let removePhysic = false;
  const frame = useFrame(({timeDiff}) => {

    if (removePhysic && physicsId) {
      physics.removeGeometry(physicsId);
      physicsId = null;
    }
    if(mixer) {
      const deltaSeconds = timeDiff / 1000;
      mixer.update(deltaSeconds);
      app.updateMatrixWorld();
    }

  });

  (async () => {
    const u = `${baseUrl}dummy.glb`;
    let o = await new Promise((accept, reject) => {
      const {gltfLoader} = useLoaders();
      gltfLoader.load(u, accept, function onprogress() {}, reject);
    });
    mixer = new THREE.AnimationMixer( o.scene );
    clips = o.animations;
    o = o.scene;

    o.traverse(obj => {
      if(obj.isMesh) {
        obj.castShadow = true;
      }
    });

    app.add(o);
    
    physicsId = physics.addGeometry(o);
  })();
  app.removePhysicsObjects = () => {
    removePhysic = true;
  }
  app.removeSubApps = () => {
    frame.cleanup();
  }
  
  useCleanup(() => {
    physics.removeGeometry(physicsId);
  });

  return app;
};
