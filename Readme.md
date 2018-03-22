# iRacing Replay Video

## Requirements
- iRacing game installed
- iRacing Replay Overlay ( https://github.com/vipoo/iRacingReplayOverlay.net )
- ffmpeg

## Usage

- Clone repository

- Run `npm install` or `yarn install`

- Rename files generate by iRacing Replay Overlay (iRO) in this way
  - short video > `intro.mp4`
  - long video > `video.mp4`
  - xml file > `data.xml`
  - logo file > `banner.jpg'
  
- Move all files into `convert` directory

- Start using `yarn run all`

## Customise

Open `templates` directory and edit html files.
  