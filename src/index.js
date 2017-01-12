import React from "react";
import ReactDOM from "react-dom";
import numeral from "numeral";
import {chunk, noop} from "lodash";
import {Architect, Trainer} from "synaptic";
import Chance from "chance";
import "../node_modules/bulma/css/bulma.css";
import "./index.css";
import letterB from "./letter_b.json";

class App extends React.Component {
    constructor(props) {
        super(props);

        const letterWidth = letterB.width;
        const letterTiles = letterB.tiles;

        /* Initialize Chance, our random data generator */
        this.chance = new Chance();

        /* Initialize the perceptron network and its trainer  */
        this.network = new Architect.Perceptron(letterTiles.length, 5, 1);
        this.trainer = new Trainer(this.network);

        // const width = 7;
        // const height = 9;
        // let tiles = [];

        // let count = 0;
        // for (let i = 0; i < width * height; i++) {
        //     tiles.push({ id: count++, isActive: false });
        // }

        this.trainingSet = this.generateTrainingSet.bind(this)(letterTiles.length, 10000);
        
        /* The only training set which outputs to true */
        this.trainingSet.push({
            input: letterTiles.map(tile => tile.isActive ? 1 : 0),
            output: [1]
        });

        console.log(this.trainingSet);

        this.state = {
            tileWidth: letterWidth,
            tiles: letterTiles,
            trainingSet: [],
            networkData: {},
            isTraining: false
        }

        this.toggleTile = this.toggleTile.bind(this);
        this.startTraining = this.startTraining.bind(this);
    }

    /*
        This function only generates training sets which outputs are false 
        due to the programmer's inability to generate good examples for the true
        counterparts
    */
    generateTrainingSet(tilesAmount, trainingSetAmount) {
        
        const chance = this.chance;

        const trainingSet = [];
        for (let i = 0; i < trainingSetAmount; i++) {
            const input = [];
            for (let j = 0; j < tilesAmount; j++) {
                input.push(chance.bool() ? 1 : 0);
            }
            trainingSet.push({
                input: input,
                output: [0]
            });
        }

        return trainingSet;
    }

    startTraining() {
        if (this.state.isTraining) return;
        this.setState({ isTraining: true });

        this.trainer.trainAsync(this.trainingSet, {
            rate: 0.2,
            error: 0.0000005,
            log: 100
        })
        .then((results) => {
            this.setState({ isTraining: false, networkData: this.network.toJSON() });
            console.log("The training process has finished!!!");
        });
    }


    toggleTile(id) {    
        const updatedTiles = this.state.tiles.map((tile) => {
            if (tile.id === id) {
                return {...tile, isActive: !tile.isActive};
            }
            return tile;
        });

        this.setState({ tiles: updatedTiles });
    }
    
    render() {
        const {tiles, tileWidth, isTraining, networkData} = this.state;
        const tilesInJson = JSON.stringify({
            width: tileWidth,
            tiles: tiles
        }, null, '\t');
        const netInJson = JSON.stringify(networkData, null, '\t');

        const trainingButtonClass = isTraining ?
            "button is-primary is-small is-loading" :
            "button is-primary is-small";
        
        const normalizedTiles = tiles.map(tile => tile.isActive ? 1 : 0)
        const matchRate = this.network.activate(normalizedTiles);
        
        const threshold = 0.925;
        const progressBarClass = matchRate > threshold ? "progress is-success" : "progress is-danger";
        const tagClass = matchRate > threshold ? "tag is-success" : "tag is-danger";
        const tagText = matchRate > threshold ? "Cocok" : "Tidak Cocok";


        return (
            <div className="container" style={ {maxWidth: "1000px"} }>
                <div className="section">
                    <div className="columns">
                        <div className="column">
                            <h2 className="title is-4"> PANEL </h2>
                            <p className="subtitle is-6"> Klik pada kotak untuk menyalakan atau memadamkan </p>
                            
                            <div className="content">
                                <p> Tingkat Kecocokan: {numeral(matchRate * 100).format("0.00")}%</p>
                                <p> Cocok / Tidak: <span className={tagClass}>{tagText}</span> </p>
                                <progress className={progressBarClass} value={matchRate * 100} max="100"></progress>
                            </div>
                            
                            <TileContainer toggle={this.toggleTile} width={tileWidth} tiles={tiles}/>
                        </div>
                        <div className="column">
                            <h2 className="title is-4"> DATA </h2>
                            <p className="subtitle is-6"> Data JSON yang melambangkan status panel </p>                            
                            <textarea className="textarea" value={tilesInJson} onChange={noop}></textarea>
                        </div>
                        <div className="column">
                            <h2 className="title is-4"> JARINGAN SYARAF </h2>
                            <p className="subtitle is-6"> Tampilan status jaringan syaraf dalam format JSON </p>

                            <div className="content">
                                <button onClick={this.startTraining} className={trainingButtonClass}> Train </button>
                            </div>
                            <textarea value={netInJson} onChange={noop} className="textarea"></textarea>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

class TileContainer extends React.Component {
    render() {
        const {width, tiles, toggle} = this.props;

        const rows = chunk(tiles, width).map(
            (row, index) => {   
                /* Every tile in the current row */
                const cell = row.map((tile, index) => {
                    const cellStyle = tile.isActive ? "box inputbox active" : "box inputbox";
                    return <div key={index} className={cellStyle} onClick={() => { toggle(tile.id) }}></div>
                });

                return <div key={index} className="inputbox-row">{cell}</div>
            }
        );

        return (<div>{rows}</div>);
    }
}

ReactDOM.render(
    <App/>,
    document.getElementById("root")
);