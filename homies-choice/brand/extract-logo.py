"""Cuts the HC monogram and wordmark out of the brand board as transparent PNGs.

Usage: python3 brand/extract-logo.py brand/homies-choice-brand-board.jpg
(writes hc-monogram.png / hc-wordmark.png and two preview images to the current folder)
"""
import sys
import numpy as np
from PIL import Image
src = Image.open(sys.argv[1]).convert('RGB')
def key(box, gem_box=None):
    a = np.asarray(src.crop(box)).astype(np.float32)
    R,G,B = a[...,0],a[...,1],a[...,2]
    alpha = np.clip((R-22)/110,0,1)
    if gem_box:
        x0,y0,x1,y1 = gem_box
        ag = np.clip((G-80)/45,0,1)
        m = np.zeros_like(ag); m[y0:y1,x0:x1]=1
        alpha = np.maximum(alpha, ag*m)
    rgb = np.clip(a/np.maximum(alpha,1e-3)[...,None],0,255)
    # Gold has G < R; pull green glow fringes outside the gem back to gold.
    gem = np.zeros(R.shape,bool)
    if gem_box:
        gem[gem_box[1]:gem_box[3],gem_box[0]:gem_box[2]] = G[gem_box[1]:gem_box[3],gem_box[0]:gem_box[2]] > R[gem_box[1]:gem_box[3],gem_box[0]:gem_box[2]]
    fix = ~gem
    rgb[...,1] = np.where(fix, np.minimum(rgb[...,1], rgb[...,0]*0.86), rgb[...,1])
    rgb[...,2] = np.where(fix, np.minimum(rgb[...,2], rgb[...,0]*0.6), rgb[...,2])
    alpha = np.where(fix & (G > R*1.15), alpha*0.3, alpha)
    out = np.dstack([rgb, alpha*255]).astype(np.uint8)
    im = Image.fromarray(out,'RGBA')
    return im.crop(im.getbbox())
mono = key((430,165,800,525), gem_box=(180,120,240,320))
word = key((215,555,1025,645))
mono.save('hc-monogram.png'); word.save('hc-wordmark.png')
print(mono.size, word.size)
# preview on two backgrounds
for name,bg in [('prev_dark',(6,59,46)),('prev_light',(247,243,235))]:
    W=max(mono.width,word.width)+80; H=mono.height+word.height+120
    c=Image.new('RGBA',(W,H),bg+(255,))
    c.alpha_composite(mono,((W-mono.width)//2,40)); c.alpha_composite(word,((W-word.width)//2,mono.height+80))
    c.save(name+'.png')
