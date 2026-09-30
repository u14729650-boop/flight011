# Your own photos

Drop a photo here to replace the online one. The file name is the photo's key:

| File name | Where it appears |
|---|---|
| `hero.jpg` | Home page hero and page headers |
| `DXB.jpg`, `CDG.jpg`, `LHR.jpg`, `NRT.jpg`, `MLE.jpg`, `SIN.jpg`, `JFK.jpg`, `SYD.jpg`, `FCO.jpg`, `IST.jpg`, `BKK.jpg` | Destination cards (airport code) |
| `beach.jpg` | Fare alerts banner |
| `india.jpg` | About page header |

`.jpg`, `.jpeg`, `.png` and `.webp` all work. Landscape photos around 2000 px wide look best.
The site background is a sequence of flight photos that change as you scroll:
`bg-wing.jpg` (top of the page), `bg-takeoff.jpg`, `bg-window.jpg`, `bg-terminal.jpg`, `bg-landing.jpg` (bottom).
Replace any of them by saving your own photo with that name here.
`static/img/background.jpg`, if present, replaces the first one.

To add photos from your browser: open the repository on GitHub, go to `static/img/photos`,
choose **Add file → Upload files**, drag in your photos with the names above, and commit.

## Current files

- `bg-wing.jpg`, `hero.jpg`: aircraft wing above the clouds, from the ImageNet sample image set
  (github.com/EliSchwartz/imagenet-sample-images, class "wing"). ImageNet photos were collected from
  Flickr for research, so their licence for commercial use is not confirmed. Fine for the preview and
  submission; replace with your own or a licensed photo before using the site commercially.
