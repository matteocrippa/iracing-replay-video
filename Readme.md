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
  - short video > `intro.mp4`
  - long video > `video.mp4`
  - xml file > `data.xml`
  - logo file > `banner.jpg` _(optional)_
  
- Move all files into `input` directory

- Start process using `yarn run all`

- ☕️ Wait for a while and check in `output` directory once finished

- 🎥 Feel free to share your video, if you want link to this tool


### Extra
In order to build the final video, 3 different steps are needed to be put in place, i've set direct spawn commands for them.
You can use `yarn run all` to have all the stuff in place, or use them in this sequence:

- `yarn run data` < Generates the new data file optimizing it
- `yarn run images` < Generates in `.\tmp` directory all the overlays
- `yarn run video` < Generates the videos
- `yarn run clean` < Cleans the content in `.\tmp` directory

## Customise

Open `templates` directory and edit `ejs` files.

## Changelog

- v0.0.1 / first release
- v0.0.2 / revamped base UI + banner support
- v0.0.3 / fastest lap support

## Screenshots

![](https://github.com/matteocrippa/iracing-replay-video/blob/master/.github/screen1.png?raw=true)
