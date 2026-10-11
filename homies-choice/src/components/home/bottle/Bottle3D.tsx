"use client";

import Image, { getImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/config/site";
import { cx } from "@/lib/format";
import { LIQUIDS, type Liquid } from "./liquids";
import type { BottleHandle } from "./scene";

/** Still renders of the same scene (brand/art/render-bottle.mjs), shown first and as the fallback. */
export const bottlePoster = (liquid: Liquid) => `/images/editorial/bottle-${liquid}.webp`;

type Stage = "poster" | "live" | "still";

/**
 * Probes WebGL with a throwaway canvas. The 3D only runs on a real graphics chip:
 * without WebGL — or when the browser emulates it on the CPU (no usable GPU, many
 * test robots) — the still image stays, and three.js is never downloaded.
 */
function canRun3D(allowSoftware: boolean): boolean {
  try {
    const gl = document.createElement("canvas").getContext("webgl2") ?? document.createElement("canvas").getContext("webgl");
    if (!gl) return false;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? "");
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return allowSoftware || !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer);
  } catch {
    return false;
  }
}

/**
 * The hero's turning perfume bottle. The still image paints immediately; three.js
 * is fetched once the browser is idle and the live canvas fades in over it.
 * Without WebGL (or if the GPU drops the context) the still image simply stays.
 */
export function Bottle3D({ liquid, className, priority = false }: { liquid: Liquid; className?: string; priority?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const handle = useRef<BottleHandle | null>(null);
  const liquidRef = useRef(liquid);
  const [stage, setStage] = useState<Stage>("poster");

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cancelled = false;
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = "absolute inset-0 h-full w-full cursor-grab opacity-0 transition-opacity duration-1000 ease-luxe";
    // Sideways drags spin the bottle; vertical swipes still scroll the page.
    canvas.style.touchAction = "pan-y";

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowPower = window.matchMedia("(max-width: 767px)").matches || (navigator.hardwareConcurrency ?? 8) <= 4;
    const monogramUrl = getImageProps({ src: siteConfig.logo.monogram.src, alt: "", width: 307, height: 341, unoptimized: true }).props.src;

    const start = () => {
      // `?bottle=3d` forces the 3D on (e.g. to check it on a machine without a graphics chip).
      const forced = new URLSearchParams(window.location.search).get("bottle") === "3d";
      if (!canRun3D(forced)) {
        if (!cancelled) setStage("still");
        return;
      }
      import("./scene")
        .then(({ mountBottle }) => {
          if (cancelled) return;
          el.appendChild(canvas);
          handle.current = mountBottle(canvas, {
            liquid: liquidRef.current,
            motion: !reduced,
            lowPower,
            monogramUrl,
            onReady: () => {
              if (cancelled) return;
              canvas.classList.remove("opacity-0");
              setStage("live");
            },
            onLost: () => {
              if (cancelled) return;
              canvas.remove();
              setStage("still");
            },
          });
        })
        .catch(() => {
          // No WebGL (the renderer throws) or the script failed to load.
          if (cancelled) return;
          canvas.remove();
          setStage("still");
        });
    };

    // Only after the page (and the still image) has loaded and the browser is idle,
    // so the 3D never competes with the first paint.
    let idle: number | undefined;
    let timer: number | undefined;
    const kickoff = () => {
      if (cancelled) return;
      if (window.requestIdleCallback) idle = window.requestIdleCallback(start, { timeout: 2000 });
      else timer = window.setTimeout(start, 200);
    };
    if (document.readyState === "complete") kickoff();
    else window.addEventListener("load", kickoff, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", kickoff);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer !== undefined) window.clearTimeout(timer);
      handle.current?.dispose();
      handle.current = null;
      canvas.remove();
    };
  }, []);

  useEffect(() => {
    liquidRef.current = liquid;
    handle.current?.setLiquid(liquid);
  }, [liquid]);

  return (
    <div
      ref={host}
      // Positioned by the caller (absolute) or in the flow (relative) — never both.
      className={cx(!/\babsolute\b/.test(className ?? "") && "relative", className)}
      data-bottle={stage}
      role="img"
      aria-label={`A ${LIQUIDS[liquid].label.toLowerCase()} Homies Choice perfume bottle with a gold cap, slowly turning`}
    >
      <Image
        src={bottlePoster(liquid)}
        alt=""
        fill
        preload={priority}
        loading={priority ? "eager" : undefined}
        fetchPriority={priority ? "high" : undefined}
        sizes="(min-width: 1024px) 30rem, 90vw"
        className={cx(
          "pointer-events-none object-contain transition-opacity duration-1000 ease-luxe select-none",
          stage === "live" && "opacity-0",
          stage === "still" && "animate-float-slow",
        )}
      />
    </div>
  );
}
