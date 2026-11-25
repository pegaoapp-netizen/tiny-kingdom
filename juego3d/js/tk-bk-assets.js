/* Cargador independiente. No modifica el juego existente. */
window.BKAssets = (() => {
 const root = new URL('../', document.currentScript.src);
 let catalog;
 async function list(){ if(!catalog) catalog=fetch(new URL('modelos/bk_master_manifest.json',root)).then(r=>{if(!r.ok)throw Error('Manifest '+r.status);return r.json();}).catch(e=>{catalog=null;throw e;}); return catalog; }
 async function load(grupo,id){const entry=(await list()).find(x=>x.grupo===grupo&&x.id===id);if(!entry)throw Error('Modelo desconocido');return new Promise((resolve,reject)=>new THREE.GLTFLoader().load(new URL(entry.url,root).href,resolve,undefined,reject));}
 return {list,load};
})();