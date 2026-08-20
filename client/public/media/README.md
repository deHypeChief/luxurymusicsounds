# Media

Drop the client's photographs and video in here. Anything in this folder is
served straight from the site root, so a file at

    client/public/media/four-seasons/audience-full-house.jpg

is reachable at

    /media/four-seasons/audience-full-house.jpg

and that is exactly the value to paste into any image or video field in the
admin panel.

## Where things go

| Folder | What belongs in it |
| --- | --- |
| `brand/` | Site-wide pieces: the hero background video, the About showreel |
| `easystrings/` | Israel solo, weddings, private dinners, Velvet Sessions |
| `four-seasons/` | The ensemble, concert programmes, the Advent concert |
| `luxury-music-sounds/` | Galas, corporate evenings, the whole roster together |

## Naming

Lowercase, hyphens, and say what the shot *is*, the filename is what anyone
reaches for six months from now:

    audience-full-house.jpg          good
    IMG_9138.JPG                     not

## Video

Use **MP4 (H.264 + AAC)**. It plays everywhere; `.mov` and `.mkv` do not.

Ship a poster still next to every clip, named to match:

    brand/hero-loop.mp4
    brand/hero-loop.jpg      <- first frame, shown until the video is ready

Without a poster a video is a black rectangle while it loads.

**Hero loop:** 10–20 seconds, no audio track at all, under ~8 MB. It is muted
and looping, so anything longer is bandwidth nobody sees. Handbrake or:

    ffmpeg -i source.mov -t 15 -an -vf scale=1920:-2 -c:v libx264 -crf 24 -movflags +faststart hero-loop.mp4
    ffmpeg -i hero-loop.mp4 -frames:v 1 hero-loop.jpg

**Everything else** (event trailers, gallery clips, the showreel) keeps its
audio and can run as long as it needs to. Still export MP4, and still
`-movflags +faststart` so it starts before it has finished downloading.

## Sizes

Photographs want to be about 2400px on the long edge and under 1 MB. Bigger
files do not look better on a screen; they just make the page slow.
