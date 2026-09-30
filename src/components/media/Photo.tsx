import { MEDIA, type MediaSlot } from '../../config/media';
import { Arrow3D, Cargo3D, Globe3D, PalletStack, Pin3D, Plane3D, Truck3D } from '../three-d/Objects3D';

/**
 * A photography slot. Renders the configured photo (lazy-loaded, graded to
 * the brand) or, until one is supplied, an art-directed 3D scene.
 */
export function Photo({ slot, className = '', eager = false, caption }: { slot: MediaSlot; className?: string; eager?: boolean; caption?: string }) {
  const m = MEDIA[slot];
  if (m.src) {
    return (
      <figure className={`photo ${className}`}>
        <img src={m.src} alt={m.alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />
        {caption && <figcaption className="photo__cap">{caption}</figcaption>}
      </figure>
    );
  }
  return (
    <figure className={`photo photo--scene scene scene--${m.scene} ${className}`} role="img" aria-label={m.alt}>
      <div className="scene__floor" aria-hidden />
      <div className="scene__glow" aria-hidden />
      <SceneObjects scene={m.scene} />
      {caption && <figcaption className="photo__cap">{caption}</figcaption>}
    </figure>
  );
}

function SceneObjects({ scene }: { scene: (typeof MEDIA)[MediaSlot]['scene'] }) {
  switch (scene) {
    case 'road':
      return (
        <>
          <div className="scene__road" aria-hidden />
          <Truck3D className="scene__o float-slow" width="64%" title="" />
          <Cargo3D className="scene__o scene__o--b float" width="16%" tone="kraft" />
          <Pin3D className="scene__o scene__o--c float-alt" width="8%" tone="emerald" />
        </>
      );
    case 'air':
      return (
        <>
          <Plane3D className="scene__o float-slow" width="66%" title="" />
          <PalletStack className="scene__o scene__o--b float" width="30%" />
          <Cargo3D className="scene__o scene__o--c float-alt" width="14%" tone="blue" />
        </>
      );
    case 'warehouse':
      return (
        <>
          <PalletStack className="scene__o float-slow" width="42%" />
          <PalletStack className="scene__o scene__o--b float" width="30%" />
          <Cargo3D className="scene__o scene__o--c float-alt" width="16%" tone="white" />
        </>
      );
    case 'movers':
      return (
        <>
          <Cargo3D className="scene__o float-slow" width="30%" tone="kraft" />
          <Cargo3D className="scene__o scene__o--b float" width="22%" tone="kraft" />
          <Cargo3D className="scene__o scene__o--c float-alt" width="15%" tone="emerald" />
          <Arrow3D className="scene__o scene__o--d float" width="18%" />
        </>
      );
    case 'parcels':
      return (
        <>
          <Cargo3D className="scene__o float-slow" width="28%" tone="blue" />
          <Cargo3D className="scene__o scene__o--b float" width="22%" tone="kraft" />
          <Cargo3D className="scene__o scene__o--c float-alt" width="17%" tone="white" />
        </>
      );
    default:
      return (
        <>
          <Globe3D className="scene__o float-slow" width="42%" />
          <Pin3D className="scene__o scene__o--b float" width="10%" />
          <Pin3D className="scene__o scene__o--c float-alt" width="8%" tone="emerald" />
          <Cargo3D className="scene__o scene__o--d float" width="14%" tone="blue" />
        </>
      );
  }
}
