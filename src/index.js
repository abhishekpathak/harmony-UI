import {config} from './config.js';
import {youtubeToHarmonyArray} from './adapters.js'
import React from 'react';
import ReactDOM from 'react-dom';
import Youtube from 'react-youtube';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';
import './index.css';
import { Navbar, Row, Col, Grid,
 Button, Table, Glyphicon, Image } from
'react-bootstrap';
import FacebookLogin from 'react-facebook-login';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import SearchBar from 'material-ui-search-bar';
import injectTapEventPlugin from 'react-tap-event-plugin';
import MdPlayCircleFilled from 'react-icons/lib/md/play-circle-filled';
import MdPauseCircleFilled from 'react-icons/lib/md/pause-circle-filled';
import MdSkipPrevious from 'react-icons/lib/md/skip-previous';
import MdSkipNext from 'react-icons/lib/md/skip-next';
injectTapEventPlugin();


class Recommendation extends React.Component {
    render() {
        return (
            <tr>
            <td className="col-lg-1">
            <Image className="playlist-thumbnail" src={"https://img.youtube.com/vi/" + this.props.videoid+ "/0.jpg"} responsive />
            </td>
            <td className="col-lg-11">
            <p className="title"
            onClick={ () => {this.props.enqueue(
                {
                videoid: this.props.videoid,
                track: this.props.value
                }
            )}}
            >{this.props.value}
            </p>
            </td>
            </tr>
        )
    }
}

class LoveButton extends React.Component {
    constructor() {
        super();
        this.state = {
            'in_library': false
        };
    }

    componentDidMount(){
        var uri = encodeURI(process.env.REACT_APP_API_URL + "/library/songexists?videoid=" + this.props.element.videoid + "&userid=" + this.props.user.id);
        fetch(uri).then((response) => {
        return response.json();
        }).then((data) => {
            this.setState({in_library: data.status});
        });
    }

    toggleLoveSong() {
        var operation = this.state.in_library === true ? "remove" : "add";
        var uri = encodeURI(process.env.REACT_APP_API_URL + "/library?operation=" + operation + "&username=" + this.props.user.name + "&userid=" + this.props.user.id + "&songtrack=" + this.props.element.track + "&songartist=&songrating=&songfav=&songvideoid=" + this.props.element.videoid);
        fetch(uri).then((response) => {
            if (response.ok) {
                this.setState({
                    'in_library' : operation === "add" ? true : false
                });
            }
        });
    }

    render() {

        return(
            <Glyphicon
            glyph={this.state.in_library === true ? "heart":"heart-empty"}
            onClick={ () => {this.toggleLoveSong()} }
            />
        );
    }
}

class Playlist extends React.Component {
    componentDidUpdate() {
        this.props.trim();
        this.props.persist();
    }


    render() {

        const playlist = this.props.elements.map((element, index) =>
        <tr key={element.hashid} className={this.props.isCurrentSong(element.hashid) ? "current-song":"other-song"}>
        <td>
        <Image className="playlist-thumbnail" src={"https://img.youtube.com/vi/" + element.videoid+ "/0.jpg"} responsive />
        </td>
        <td>
            <p className={this.props.isCurrentSong(element.hashid) ? "current-song":"title"}
            onClick={ () => {this.props.handleSongClick(element.hashid)} }
            >
            {element.track}
            </p>
        </td>
        <td>
            <LoveButton
            element={element}
            user={this.props.user}
            />
        </td>
        <td>
            {this.props.isCurrentSong(element.hashid) ? (null) :
                (
                <Button
                className="close"
                onClick={ () => {this.props.removeFromPlaylist(element.hashid)} }
                >
                &times;
                </Button>
                )
            }
        </td>
        </tr>
        );
        return (
            <Table className = "playlist">
            <tbody>
                {playlist}
            </tbody>
            </Table>
        )
    }
}

class Recommendations extends React.Component {
    constructor() {
        super();
        this.state = {recommendations: []};
    }

    componentDidMount() {
        this.getRecommendations(this.props.videoid);
    }

    componentWillReceiveProps() {
        this.getRecommendations(this.props.videoid);
    }

    getRecommendations(videoid) {
        var uri = encodeURI("https://www.googleapis.com/youtube/v3/search?videoEmbeddable=any&part=snippet&fields=items(id,snippet)&type=video&maxResults=20&key=AIzaSyCbfxhEDNKXXPFbmjttsqFvGHxjvTlfVxg&relatedToVideoId="+ videoid)
        fetch(uri).then((response) => {
            return response.json();
            }).then((data) => {
                let recommendations = youtubeToHarmonyArray(data);
                this.setState({recommendations: recommendations});
            });
    }

    render() {
        const recommendations = this.state.recommendations.map((recommendation) =>
            <Recommendation
            key={recommendation.videoid}
            videoid={recommendation.videoid}
            value={recommendation.track}
            enqueue={this.props.enqueue}
            />
        );

        return (
            <Table className = "recommendations">
            <tbody>
                {recommendations}
            </tbody>
            </Table>
        )
    }
}

class VideoBox extends React.Component {
    constructor() {
        super();

        this.state = {
            player: null,
        };

        this.onReady = this.onReady.bind(this);
        this.onStateChange = this.onStateChange.bind(this);
        this.timer = this.timer.bind(this);
    }

    componentDidUpdate() {
        if (this.props.playing === true) {
            this.state.player.playVideo();
        } else {
            this.state.player.pauseVideo();
        };
    }

    timer(event) {
        // persist only if the video is playing
        if (event.target.getPlayerState() === 1) {
            var time = parseInt(event.target.getCurrentTime(), 10);
            this.props.persist_seek(time);
        };
    }

    render() {
        const opts = {
            height: 80,
            width: 144,
            playerVars: {
                'rel': 0,
                'controls': 1,
                'autoplay': this.props.playing === true ? 1 : 0,
                'start': parseInt(this.props.seek, 10),
                'showinfo': 0,
                'modestbranding': 1,
                'iv_load_policy': 3
            }
        };

        return (
            <Youtube
                ref="youtube"
                videoId={this.props.videoid}
                opts={opts}
                onReady={this.onReady}
                onStateChange={this.onStateChange}
            />
        );
    }

    onReady(event) {
        this.setState({
            player: event.target,
        },
        () => {setInterval(this.timer, 2000, event)}
        );
    }

    onStateChange(event) {
        this.props.triggerOnStateChange(event.data);
    }
}

class LeftMain extends React.Component {
    render() {
        return(
            <div className="leftmain">
                <Playlist
                    elements={this.props.elements}
                    current_index={this.props.current_index}
                    user={this.props.user}
                    playing={this.props.playing}
                    trim={this.props.trim}
                    persist={this.props.persist}
                    handleSongClick={this.props.handleSongClick}
                    removeFromPlaylist={this.props.removeFromPlaylist}
                    toggleLoveSong={this.props.toggleLoveSong}
                    isCurrentSong={this.props.isCurrentSong}
                />
            </div>
        )
    }
}

class RightMain extends React.Component {
    render() {
        return(
            <div className="rightMain">
                <Recommendations
                videoid={this.props.videoid}
                enqueue={this.props.enqueue}
                />
            </div>
        )
    }
}

class Header extends React.Component {
    constructor(){
        super();
        this.state = {
            value: ""
        };
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit() {
        const uri_prefix = "https://www.googleapis.com/youtube/v3/search?videoEmbeddable=any&key=AIzaSyCbfxhEDNKXXPFbmjttsqFvGHxjvTlfVxg&part=snippet&fields=items(id,snippet)&type=video&maxResults=5&q="
        const uri = encodeURI(uri_prefix + this.state.value);
        fetch(uri).then((response) => {
            return response.json();
        }).then((data) => {
            let search_results = youtubeToHarmonyArray(data);
            this.props.enqueue(search_results[0]);
        });
    }

    render() {
        const searchform = (
            <SearchBar
                onChange={(value) => this.setState({value:value})}
                onRequestSearch={() => this.handleSubmit()}
                style={{
                    margin: '0 auto',
                    maxWidth: 600
                }}
            />
        );

        const logo = (
            <div className="logo-box">
                <span className="logo-1">Harmony </span>
                <span className="logo-2">Music</span>
            </div>
        )

        const avatar = (
            <Image src={this.props.user.avatar} circle responsive/>
        )

        const searchbar = (
                <Row>
                    <Col md={2} lg={2}>
                        {logo}
                    </Col>
                    <Col md={1} lg={1}></Col>
                    <Col md={6} lg={6}>
                        {searchform}
                    </Col>
                    <Col md={2} lg={2}></Col>
                    <Col md={1} lg={1}>
                        {avatar}
                    </Col>
                </Row>
         );

        return (
        <Navbar fixedTop fluid className="header">
            {searchbar}
        </Navbar>
        )
    }
}

class Footer extends React.Component {
    render() {

        let playpause = null;
        if (this.props.playing === true) {
            playpause = (<MdPauseCircleFilled onClick={this.props.togglePlay} className="controls-play"/>)
        } else {
            playpause = (<MdPlayCircleFilled onClick={this.props.togglePlay} className="controls-play"/>)
        }

        const controls = (
            <div className="controls-box">
                <MdSkipPrevious onClick={this.props.handlePrev} className="controls"/>
                {playpause}
                <MdSkipNext onClick={this.props.handleNext} className="controls"/>
            </div>
        );
        const equalizer = (
            <img className="equalizer" src={this.props.playing? config.EQUALIZER_IMAGE : config.EQUALIZER_STILL_IMAGE} alt="Equalizer" />
        )

        const navbarInstance = (
                      <Row>
                          <Col lg={2}>
                              <VideoBox
                                  videoid={this.props.elements[this.props.current_index].videoid}
                                  playing={this.props.playing}
                                  seek={this.props.seek}
                                  persist_seek={this.props.persist_seek}
                                  triggerOnStateChange={this.props.triggerOnStateChange}
                              />
                          </Col>
                          <Col lg={2}></Col>
                          <Col lg={4}>
                              <p className="marquee"><span>
                              {this.props.track}
                              </span></p>
                              {controls}
                              </Col>
                          <Col lg={3}></Col>
                          <Col lg={1}>
                              {equalizer}
                          </Col>
                      </Row>
         );

        return (
        <Navbar fixedBottom fluid className="footer">
            {navbarInstance}
        </Navbar>
        )
    }
}

class Total extends React.Component {
    constructor(){
        super();
        var persisted_state = JSON.parse(localStorage.getItem('harmony-playlist'));
        if (persisted_state === null) {
            persisted_state = config.INIT_STATE;
        }
        this.state = persisted_state;
        this.handleSongClick = this.handleSongClick.bind(this);
        this.findSonginPlaylist = this.findSonginPlaylist.bind(this);
        this.enqueue = this.enqueue.bind(this);
        this.handleNext = this.handleNext.bind(this);
        this.handlePrev = this.handlePrev.bind(this);
        this.togglePlay = this.togglePlay.bind(this);
        this.trim = this.trim.bind(this);
        this.persist = this.persist.bind(this);
        this.persist_seek = this.persist_seek.bind(this);
        this.removeFromPlaylist = this.removeFromPlaylist.bind(this);
        this._playNextFromPlaylist = this._playNextFromPlaylist.bind(this);
        this.triggerOnStateChange = this.triggerOnStateChange.bind(this);
        this.isCurrentSong = this.isCurrentSong.bind(this);
    }

    findSonginPlaylist(hashid){
        // Search for song in playlist
        for(var i=0; i < this.state.elements.length; i++) {
            if (this.state.elements[i].hashid === hashid){
                return i;
            }
        }
        return -1;
    }

    isCurrentSong(hashid) {
        return this.findSonginPlaylist(hashid) === this.state.current_index;
    }

     getHashid() {
        return (new Date()).getTime();
     }

     handleSongClick(hashid){
        var i = this.findSonginPlaylist(hashid);
        this.setState({
                current_index: i,
                seek: 0
            });
     }

     handlePrev() {
        if (this.state.current_index === 0)
            return null;
        this.setState({
            current_index: this.state.current_index - 1,
            seek: 0
        });
     }

     handleNext() {
        if (this.state.current_index === this.state.elements.length - 1)
            this._playNextFromLibrary();
        else
            this._playNextFromPlaylist();
     }

     _playNextFromPlaylist() {
        this.setState({
            current_index: this.state.current_index + 1,
            seek: 0
        },
        this.updateLastPlayedTimestamp()
        )
     }

     _playNextFromLibrary() {
        var uri = encodeURI(process.env.REACT_APP_API_URL + "/library/get?userid=" + this
        .props.user.id)
        fetch(uri).then((response) => {
            return response.json();
            }).then((data) => {
                var newElement = {
                'videoid': data.videoid,
                'track': data.track,
                'hashid': data.videoid + '__' + this.getHashid()
                };
                this.setState({
                    elements: this.state.elements.concat(newElement),
                    current_index: this.state.current_index + 1,
                    seek: 0
                },
                this.updateLastPlayedTimestamp()
                );
            })
     }

     enqueue(data) {
        var newElement = {
            'videoid': data.videoid,
            'track': data.track,
            'hashid': data.videoid + '__' + this.getHashid()
        }

        this.setState({
            elements: this.state.elements.concat(newElement)
        });
     }

     togglePlay() {
        this.setState({
            playing: !this.state.playing
        })
     }

     // if the playlist becomes too large, trim it
     trim() {
        if (this.state.current_index > config.PLAYLIST_TRIM_SIZE) {
            this.setState({
                elements: this.state.elements.slice(this.state.current_index
                - config.PLAYLIST_TRIM_SIZE),
                current_index: config.PLAYLIST_TRIM_SIZE,
            })
        }
     }

     removeFromPlaylist(hashid) {
        var index = this.findSonginPlaylist(hashid);

        var mod_elements_1 = this.state.elements.slice(0, index);
        var mod_elements_2 = this.state.elements.slice(index + 1);
        var mod_current_index = this.state.current_index;

        if (index === -1) {
            console.log("remove song: cannot find item in playlist.");
            return;
        } else if (index === this.state.current_index) {
            console.log("remove song: cannot remove currently playing.");
            return;
        } else if (index < this.state.current_index) {
            mod_current_index = this.state.current_index - 1;
        }

        this.setState({
            elements: mod_elements_1.concat(mod_elements_2),
            current_index: mod_current_index,
        });
     }

     updateLastPlayedTimestamp() {
         var uri = encodeURI(process.env.REACT_APP_API_URL + "/library/updatelastplayed?userid=" +
         this.props.user.id + "&videoid=" + this.state.elements[this.state
         .current_index].videoid);
         fetch(uri).then((response) => {
            if (!response.ok) {
            }
         });
     }

     triggerOnStateChange(state) {
        if (state === 0) {
            // ended
            this.handleNext();
        }
        else if (state === 1) //playing
            this.setState({playing: true});
        else if (state === 2) //paused
            this.setState({playing: false});
     }

     persist() {
        localStorage.setItem('harmony-playlist', JSON.stringify(this.state));
     }

     persist_seek(seek) {
        var persisted_state = JSON.parse(localStorage.getItem('harmony-playlist'));
        persisted_state.seek = seek;
        localStorage.setItem('harmony-playlist', JSON.stringify(persisted_state));
     }

     render() {
        var current_song = this.state.elements[this.state.current_index];

        return (
            <Grid fluid>
            <Header
            enqueue={this.enqueue}
            user={this.props.user}
            />
            <Row className="middle">

               <Col lg={7} md={8}><LeftMain
               elements={this.state.elements}
               current_index={this.state.current_index}
               seek={this.state.seek}
               user={this.props.user}
               playing={this.state.playing}
               trim={this.trim}
               persist={this.persist}
               persist_seek={this.persist_seek}
               handleSongClick={this.handleSongClick}
               triggerOnStateChange={this.triggerOnStateChange}
               removeFromPlaylist={this.removeFromPlaylist}
               toggleLoveSong={this.toggleLoveSong}
               isCurrentSong={this.isCurrentSong}
               /></Col>

               <Col lg={5} md={4}><RightMain
               videoid={this.state.elements[this.state.current_index].videoid}
               enqueue={this.enqueue}
               /></Col>
            </Row>
            <Footer
                elements={this.state.elements}
                current_index={this.state.current_index}
                seek={this.state.seek}
                persist_seek={this.persist_seek}
                triggerOnStateChange={this.triggerOnStateChange}
                track={current_song.track}
                playing={this.state.playing}
                handlePrev={this.handlePrev}
                handleNext={this.handleNext}
                togglePlay={this.togglePlay}
            />
            </Grid>
        )
    }
}

class Login extends React.Component {
    render() {
        const loginbutton = (
            <FacebookLogin
                appId={process.env.REACT_APP_APP_ID}
                autoLoad={true}
                fields="name,email,picture"
                callback={responseFacebook}
                icon="fa-facebook"
                size="metro"
            />
        );

        const welcome = (
            <h4> Welcome to Harmony Music </h4>
        );

        const features = (
            <ul> Features
                <li> Search and add any youtube track to the playlist </li>
                <li> Click the love button to store the track to your library </li>
                <li> Never-ending playlist - Harmony automatically plays a track from your media library if the playlist ends.</li>
                <li> View related tracks on the right side, click on any track to add it to the playlist. </li>
                <li> More music sources like soundcloud, local mp3 files, dropbox coming soon.</li>
            </ul>
        );

        const disclaimer = (
            <ul> Privacy: we only access the following :
                <li>email - to store your loved tracks </li>
                <li>profile picture - to display on the app </li>
            </ul>
        );

        return (
            <Grid fluid>
                <Row>
                    <Col lg={3}></Col>
                    <Col lg={6}>
                        <Row bsClass="login-row"> {welcome} </Row>
                        <Row bsClass="login-row"> {features} </Row>
                        <Row bsClass="login-row"> {loginbutton} </Row>
                        <Row bsClass="login-row"> {disclaimer} </Row>
                    </Col>
                    <Col lg={3}></Col>
                </Row>
            </Grid>
        );
    }
}

const responseFacebook = (response) => {
  let user = {
    name: null,
    id: null,
    avatar: null
  };
  if (response.email !== null) {
      user.name = response.name;
      user.id = response.email;
      user.avatar = response.picture.data.url;
      ReactDOM.render(
          <MuiThemeProvider>
              <Total user={user}/>
          </MuiThemeProvider>,
        document.getElementById('root')
        );
  }
};

ReactDOM.render(<Login/>, document.getElementById('root'));