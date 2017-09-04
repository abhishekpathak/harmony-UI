# Harmony Music Player - Web app

This is the front-end for the harmony music player, located at [my website](http://music.abhishekpathak.net).

Harmony music player was created to scratch a personal itch : playing music from all available sources seamlessly, without disconnects like:

* licensing restrictions of different platforms - spotify does not have good bollywood music, Saavn does not have good classic rock etc.
* having audio-only tracks - if you want to watch the video, open up youtube separately.
* alternatively, maintain a local media library - take pains to discover new music, then download it, and carry it in a hard disk. No cross-device music!
* Music discovery - have separate platforms for music discovery, with their own restrictions. In recommending related tracks, nothing beats Youtube - but there is no music player there (no Youtube red in India).
* Track metadata - something like MonkeyRok in MediaMonkey - a dashboard with video, related tracks, artist information - there are different platforms for this - youtube, last.fm, songmeanings but no unified interface.

So I built Harmony to provide that unified interface - all music sources, all metadata sources, and total portability of music. It is still very much a task in progress, but it has become my default media player now.

Features :

* Search and add, or remove tracks from the playlist
* See recommended tracks on the right sidebar, click on any track to add to playlist
* Click the love icon to add a track to add it to your media library.
* Click again to remove.
* never ending playlist - Harmony automatically adds a random track from your media library if the playlist ends.
* Pause, backward and forward supported.
* State persistence - the track, paused/playing state and the seek all restore when you relaunch Harmony.
* Library in the cloud - access your Harmony from any device, just by logging in.
* Currently only youtube as a music source is supported.

Features in the pipeline:

* More music sources - soundcloud, local mp3 files etc
* better search feedback - give search results (say top 5) and option to enqueue one of them.
* Mobile app
* Download tracks for offline listening (via dropbox)
* Custom playlists to organise tracks instead of a global playlist.

Known Bugs:
* random state inconsistencies, esp when buffering tracks.
* high response time when starting, due to Heroku's dyno sleeping.


### Stuff used to make this:

* [React](https://facebook.github.io/react/)
* [create-react-app](https://github.com/facebookincubator/create-react-app)
* [react-bootstrap](https://react-bootstrap.github.io/)
* [material-ui](http://www.material-ui.com/)
* [Heroku](https://www.heroku.com/)