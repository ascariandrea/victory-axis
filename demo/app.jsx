/*global document:false*/
/*global window:false */
import React from "react";
import {VictoryAxis} from "../src/index";
import d3 from "d3";
import _ from "lodash";
import Radium from "radium";

@Radium
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tickValues: [0],
      domain: [0, 1]
    };
  }

  getTickValues() {
    return _.map(_.range(5), (i) => {
      return 10 * i + _.random(5);
    });
  }

  getDomain() {
    const someNumber = _.random(2, 5);
    return [-someNumber, someNumber];
  }

  componentDidMount() {
    window.setInterval(() => {
      this.setState({
        tickValues: this.getTickValues(),
        domain: this.getDomain()
      });
    }, 2000);
  }

  render() {
    const style = {
      base: {
        margin: 20,
        width: 700, // same as the containing svg
        height: 400 // same as the containing svg
      },
      svg: {
        width: 700,
        height: 400
      }
    };

    return (
      <div className="demo">
        <div>
          <h1>Default Axis</h1>
          <VictoryAxis style={style}
            tickValues={this.state.tickValues}
            animate={true}
            showGridLines={true}/>
        </div>
        <div>
          <h1>Time Scale Axis</h1>
          <VictoryAxis
            label="Decades"
            showGridLines={true}
            scale={() => d3.time.scale()}
            tickValues={[
              new Date(1980, 1, 1),
              new Date(1990, 1, 1),
              new Date(2000, 1, 1),
              new Date(2010, 1, 1),
              new Date(2020, 1, 1)]}
              tickFormat={() => d3.time.format("%Y")}/>
        </div>
        <div>
        <h1>X-Y Axis</h1>
          <svg style={style.svg}>
            <VictoryAxis
              domain={this.state.domain}
              showGridLines={true}
              crossAxis={true}
              orientation="bottom"
              offsetX={50}
              offsetY={150}
              containerElement="g"/>
            <VictoryAxis
              domain={this.state.domain.concat().reverse()}
              showGridLines={true}
              crossAxis={true}
              orientation="left"
              offsetX={250}
              offsetY={50}
              containerElement="g"/>
            </svg>
        </div>
        <div>
        <h1>Log Scale Axis</h1>
          <VictoryAxis
            showGridLines={true}
            orientation="left"
            scale={() => d3.scale.log()}
            domain={[1, 5]}
            offsetX={50}/>
        </div>
      </div>
    );
  }
}

const content = document.getElementById("content");

React.render(<App/>, content);
