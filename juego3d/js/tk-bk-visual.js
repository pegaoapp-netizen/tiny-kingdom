/* Brother Kingdom: optional visual layer, Three.js r149. */
window.BKVisual = (()=>{
 const T=THREE;
 function configure(renderer,quality='high'){
  renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='high'?2:1));
  renderer.outputEncoding=T.sRGBEncoding; renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=1.15;
  renderer.shadowMap.enabled=quality==='high'; renderer.shadowMap.type=T.PCFSoftShadowMap;
 }
 function lighting(scene,center,radius,quality='high'){
  const group=new T.Group(); scene.add(group); group.add(new T.HemisphereLight(0xc6dcff,0x66513b,1.15));
  const sun=new T.DirectionalLight(0xffe1b2,2.3); sun.position.copy(center).add(new T.Vector3(3,5,3).multiplyScalar(radius)); sun.target.position.copy(center); group.add(sun,sun.target);
  sun.castShadow=quality==='high'; sun.shadow.mapSize.set(1024,1024); const c=sun.shadow.camera; c.left=c.bottom=-radius*2;c.right=c.top=radius*2;c.near=.01;c.far=radius*15;c.updateProjectionMatrix();sun.shadow.normalBias=radius*.008;
  const rim=new T.DirectionalLight(0x729dff,.9);rim.position.copy(center).add(new T.Vector3(-3,2,-4).multiplyScalar(radius));group.add(rim);return group;
 }
 function surface(model,quality='high') {model.traverse(o=>{if(!o.isMesh)return;o.castShadow=o.receiveShadow=quality==='high';});}
 function spark(scene,position,radius=1){const n=32,arr=new Float32Array(n*3),vel=[];for(let i=0;i<n;i++){arr.set([position.x,position.y,position.z],i*3);vel.push(new T.Vector3(Math.random()-.5,Math.random()*.9,Math.random()-.5).multiplyScalar(radius*3));}const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(arr,3));const m=new T.PointsMaterial({color:0xffc45b,size:radius*.045,transparent:true,depthWrite:false,blending:T.AdditiveBlending});const p=new T.Points(g,m);scene.add(p);let age=0;return dt=>{age+=dt;if(age>=.65){scene.remove(p);g.dispose();m.dispose();return false;}for(let i=0;i<n;i++){vel[i].y-=dt*radius*2;arr[i*3]+=vel[i].x*dt;arr[i*3+1]+=vel[i].y*dt;arr[i*3+2]+=vel[i].z*dt;}g.attributes.position.needsUpdate=true;m.opacity=1-age/.65;return true;};}
 return {configure,lighting,surface,spark};
})();