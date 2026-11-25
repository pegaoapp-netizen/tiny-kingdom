# Modelos 3D de los enemigos de la Campaña

Hechos por el dueño en Meshy, achicados para el juego el 25-nov-2026.
Antes pesaban entre 43 y 62 MB cada uno; ahora cada uno pesa unos 1,4 MB.
Llevan una sola textura de color de 1024 en webp, sin las texturas de relieve ni de brillo, porque el juego pinta con Lambert.

| Archivo | Personaje | Animaciones |
|---|---|---|
| 01_bandido.glb | Bandido | Running, Walking |
| 02_arquero_bandido.glb | Arquero bandido | Running, Walking |
| 03_lobo.glb | Lobo | Running, Walking |
| 04_trasgo.glb | Trasgo | Running, Walking |
| 05_chaman_trasgo.glb | Chamán trasgo | Running, Walking |
| 06_ogro.glb | Ogro | Running, Walking |
| 07_trol_de_piedra.glb | Trol de piedra | Running, Walking |
| 08_esqueleto.glb | Esqueleto | Running, Walking |
| 09_nigromante.glb | Nigromante | Running, Walking |
| — | **10 Gárgola: FALTA** (el dueño la está haciendo) | — |
| 11_capitan_rojo.glb | Capitán Rojo (jefe) | Running, Walking |
| 12_garra_negra.glb | Garra Negra (jefe) | Running, Walking |
| 13_colmillo.glb | Colmillo, el lobo alfa (jefe) | Running, Walking |
| 14_zarza.glb | Zarza, la bruja (jefa) | Running, Walking |
| 15_brusco.glb | Brusco, capataz ogro (jefe) | Running, Walking |
| 16_gorlak.glb | Gorlak el Rompemuros (jefe) | Running, Walking |
| 17_caballero_negro.glb | El Caballero Negro (jefe) | Running, Walking |
| 18_ignaroth.glb | Ignaroth, el dragón (jefe) | **ninguna** (el dueño lo está arreglando) |

## Para quien los ponga en la Campaña (es la parte de Chris)
- **Ojo con la medida:** los de Mixamo traen el `Armature` a escala 0,01 y, antes de posar, miden diminutos. Mídelos por la posición de los huesos, no con `Box3().setFromObject`. Así lo hace `pruebas/ver-modelos-campana.html`.
- Todos traen solo **caminar y correr**, sin animación de ataque ni de quieto. El ataque se puede simular con un empujón o un giro por código.
- Para que no se vean oscuros, usa `MeshLambertMaterial` con `emissive` y `emissiveMap` igual que los edificios de Tripo (`modeloTripo` en `js/modelos.js`).
- Para verlos todos caminando: abre `pruebas/ver-modelos-campana.html` en el servidor local.
