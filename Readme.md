# iRacing Replay Video

![](https://github.com/matteocrippa/iracing-replay-video/blob/master/.github/screen2.png?raw=true)

## Requirements
- iRacing game installed
- iRacing [Replay Overlay]( https://github.com/vipoo/iRacingReplayOverlay.net )
- Install [ffmpeg ](https://github.com/adaptlearning/adapt_authoring/wiki/installing-ffmpeg)
- Install [nodejs](https://nodejs.org/en/)

## Usage

- Clone repository locally `git clone git@github.com:matteocrippa/iracing-replay-video.git`

- Run `npm install` or `yarn install`

- Rename files generate by iRacing Replay Overlay (iRO) in this way
  - short video > `intro.mp4` _(optional)_
  - long video > `video.mp4`
  - xml/replayscript file > `data.xml` (if replayscript file is in place rename to data.xml)
  - music file > `music.mp3` _(optional)_
  - logo file > `banner.jpg` _(optional)_
  
- Move all files into `input` directory

- Start process using `yarn run all`

- ☕️ Wait for a while and check in `output` directory once finished

- 🎥 Feel free to share your video, if you want link to this tool


### Extra
In order to build the final video, 4 different steps are needed to be put in place, i've set direct spawn commands for them.
You can use `yarn all` to have all the stuff in place, or use them in this sequence:

- `yarn data` < Generates the new data file optimizing it.
- `yarn images` < Generates all the overlays.
- `yarn video` < Generates the videos.
- `yarn commentary` < Generate the commentary audios.
- `yarn clean` < Clean up `\tmp` directory contents.

## Customise

Open `templates` directory and edit `ejs` files.

## Changelog

- v0.0.1 / first release
- v0.0.2 / revamped base UI + banner support
- v0.0.3 / fastest lap support
- v0.0.4 / better fastest lap handler + configuration early implementation
- v0.0.5 / fix long race issue and windows ffmpeg compatibility
- v0.0.6 / add yellow flag support
- v0.0.7 / improved performance, fixed windows issue on long video
- v0.0.8 / cleanup code, improved cleaning up directory
- v0.0.9 / add support for last lap white flag header
- v0.0.10 / add support for commentary (experimental)
- v0.0.11 / add support for music during intro and improves yellow flags

## Screenshots

![](https://github.com/matteocrippa/iracing-replay-video/blob/master/.github/screen1.png?raw=true)
