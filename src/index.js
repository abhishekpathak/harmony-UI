import {config} from './config.js';
import React from 'react';
import ReactDOM from 'react-dom';
import Youtube from 'react-youtube';
import './bootstrap/bootstrap.min.css';
import './bootstrap/bootstrap-theme.min.css';
import './index.css';
import { Navbar, Nav, NavItem, Row, Col, Grid,
Form, FormGroup, FormControl, Button, Table, Glyphicon, Image } from
'react-bootstrap';
import FacebookLogin from 'react-facebook-login';


class Recommendation extends React.Component {
    render() {
        return (
            <tr>
            <td className="col-lg-2">
            <Image className="playlist-thumbnail" src={"https://img.youtube.com/vi/" + this.props.videoid+ "/0.jpg"} responsive />
            </td>
            <td className="col-lg-10">
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
        var uri = encodeURI(config.API_URL + "/library/songexists?videoid=" + this.props.element.videoid + "&userid=" + this.props.user.id);
        fetch(uri).then((response) => {
        return response.json();
        }).then((data) => {
            this.setState({in_library: data.status});
        });
    }

    toggleLoveSong() {
        var operation = this.state.in_library === true ? "remove" : "add";
        var uri = encodeURI(config.API_URL + "/library?operation=" + operation + "&username=" + this.props.user.name + "&userid=" + this.props.user.id + "&songtrack=" + this.props.element.track + "&songartist=&songrating=&songfav=&songvideoid=" + this.props.element.videoid);
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

    handleLoveButtonColor() {

    }

    render() {
        const playlist = this.props.elements.map((element, index) =>
        <tr key={element.hashid}>
        <td>
        <Image className="playlist-thumbnail" src={"https://img.youtube.com/vi/" + element.videoid+ "/0.jpg"} responsive />
        </td>
        <td>
            <p className="title"
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
            <Button
            className="close"
            onClick={ () => {this.props.removeFromPlaylist(element.hashid)} }
            >
            &times;
            </Button>
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
        var uri = encodeURI(config.API_URL + "/recommendations?q=" + videoid);
        fetch(uri).then((response) => {
            return response.json();
            }).then((data) => {
                this.setState({recommendations: data});
            });
    }

    render() {
        const recommendations = this.state.recommendations.map((recommendation) =>
            <Recommendation
            key={recommendation.videoid}
            videoid={recommendation.videoid}
            value={recommendation.name}
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
            var time = parseInt(event.target.getCurrentTime());
            this.props.persist_seek(time);
        };
    }

    render() {
        const opts = {
            height: 300,
            width: 480,
            playerVars: {
                'rel': 0,
                'controls': 1,
                'autoplay': this.props.playing === true ? 1 : 0,
                'start': parseInt(this.props.seek),
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
                <VideoBox
                videoid={this.props.elements[this.props.current_index].videoid}
                playing={this.props.playing}
                seek={this.props.seek}
                persist_seek={this.props.persist_seek}
                triggerOnStateChange={this.props.triggerOnStateChange}
                />
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
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(e){
        this.setState({
            value: e.target.value
        })
    }

    handleSubmit(e){
        e.preventDefault();
        var uri = encodeURI(config.API_URL + "/query?q=" + this.state.value);
        fetch(uri).then((response) => {
            return response.json();
            }).then((data) => {
                // TODO hotfix for now
                data[0].track = data[0].name;
                console.log(data[0]);
                this.props.enqueue(data[0]);
            });
    }

    render() {
        const navbarInstance = (
                <Form inline onSubmit={this.handleSubmit}>
                <FormGroup controlId="formBasicText">
                  <FormControl
                    type="text"
                    placeholder="search..."
                    onChange={this.handleChange}
                  />
                </FormGroup>
                  <Button type="submit" className="searchButton">
                  <Glyphicon glyph="search"/>
                  </Button>
                </Form>
         );

        return (
        <Navbar inverse>
            {navbarInstance}
        </Navbar>
        )
    }
}

class Footer extends React.Component {
    render() {
        const navbarInstance = (
              <Nav>
                <NavItem onClick={this.props.handlePrev}>
                <Glyphicon glyph="backward"/>
                </NavItem>
                <NavItem onClick={this.props.togglePlay}>
                <Glyphicon glyph={this.props.playing === true ? "pause":"play"}/>
                </NavItem>
                <NavItem onClick={this.props.handleNext}>
                <Glyphicon glyph="forward"/>
                </NavItem>
                <NavItem>{this.props.track}</NavItem>
              </Nav>
         );

        return (
        <Navbar inverse fixedBottom className = "footer">
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
        var uri = encodeURI(config.API_URL + "/library/get?userid=" + this
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
         var uri = encodeURI(config.API_URL + "/library/updatelastplayed?userid=" +
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
               /></Col>

               <Col lg={5} md={4}><RightMain
               videoid={this.state.elements[this.state.current_index].videoid}
               enqueue={this.enqueue}
               /></Col>
            </Row>
            <Footer
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

const responseFacebook = (response) => {
  var user = {
    name: null,
    id: null,
    avatar: null
  };
  if (response.email != null) {
      user.name = response.name
      user.id = response.email
      user.avatar = response.picture.data.url
      //ReactDOM.unmountComponentAtNode('root');
      ReactDOM.render(
        <Total
        user={user}
        />,
        document.getElementById('root')
        );
  }
}

ReactDOM.render(
  <FacebookLogin
    appId={config.appId}
    autoLoad={true}
    fields="name,email,picture"
    callback={responseFacebook}
    icon="fa-facebook"
    size="metro"
  />,
  document.getElementById('root')
);