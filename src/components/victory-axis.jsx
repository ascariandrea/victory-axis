import React from "react";
import Radium from "radium";
import d3 from "d3";
import _ from "lodash";

@Radium
class VictoryAxis extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
    this.state.scale = this.setupScale(); // set up a scale with domain and range
    this.state.range = this.getRange();
    this.state.domain = this.getDomain();
    // code smell: order matters this.state.scale is used to determine ticks and tick format
    this.state.ticks = this.getTicks();
    this.state.tickFormat = this.getTickFormat();
  }

  warn(message) {
    if (process.env.NODE_ENV !== "production") {
      /* eslint-disable no-console */
      if (console && console.warn) {
        console.warn(message);
      }
      /* eslint-enable no-console */
    }
  }

  getStyles() {
    return _.merge({
      stroke: "#756f6a",
      fill: "#756f6a",
      fontFamily: "sans-serif",
      strokeWidth: 1,
      strokeLinecap: "round"
    }, this.props.style);
  }

  getDomain() {
    const scaleDomain = this.props.scale().domain()
    let domain;
    if (this.props.domain) {
      domain = this.props.domain;
    } else if (this.props.tickValues) {
      domain = [_.min(this.props.tickValues), _.max(this.props.tickValues)];
    } else {
      domain = scaleDomain;
    }

    // Warn when domains need more information to produce meaningful axes
    if (domain === scaleDomain && _.isDate(scaleDomain[0])) {
      this.warn("please specify tickValues or domain when creating a time scale axis");
    } else if (domain === scaleDomain && scaleDomain.length === 0) {
      this.warn("please specify tickValues or domain when creating an axis using " +
        "ordinal or quantile scales");
    } else if (domain === scaleDomain && scaleDomain.length === 1) {
      this.warn("please specify tickValues or domain when creating an axis using " +
        "a threshold scale");
    }

    return this.isVertical() ? domain.reverse() : domain;
  }

  getRange() {
    if (this.props.range) {
      return this.props.range;
    }
    const offset = this.getOffset();
    if (this.isVertical()) {
      return [offset.y, this.props.height - offset.y];
    }
    return [offset.x, this.props.width - offset.x];
  }

  isVertical() {
    return (this.props.orientation === "left" || this.props.orientation === "right");
  }

  getFontSize() {
    return this.getStyles.fontSize || 16;
  }

  getLabelPadding() {
    if (this.props.labelPadding) {
      return this.props.labelPadding;
    }
    return this.props.label ? (this.getFontSize() * 2) : 0;
  }

  getOffset() {
    const fontSize = this.getFontSize();
    const totalPadding = fontSize +
      (2 * this.props.tickSize) +
      this.getLabelPadding();
    const minimumPadding = 1.2 * fontSize;
    const x = this.isVertical() ? totalPadding : minimumPadding;
    const y = this.isVertical() ? minimumPadding : totalPadding;
    return {
      x: this.props.offsetX || x,
      y: this.props.offsetY || y
    };
  }

  getTransform() {
    const orientation = this.props.orientation;
    const offset = this.getOffset();
    const transform = {
      top: [0, offset.y],
      bottom: [0, (this.props.height - offset.y)],
      left: [offset.x, 0],
      right: [(this.props.width - offset.x), 0]
    };
    return "translate(" + transform[orientation][0] + "," + transform[orientation][1] + ")";
  }

  setupScale() {
    const scale = this.props.scale().copy();
    const range = this.getRange();
    const domain = this.getDomain();
    scale.range(range);
    scale.domain(domain);
    // hacky check for identity scale
    if (_.difference(scale.range(), range).length !== 0) {
      // identity scale, reset the domain and range
      scale.range(range);
      scale.domain(range);
      this.warn("Identity Scale: domain and range must be identical. " +
        "Domain has been reset to match range.");
    }
    return scale;
  }

  getTicks() {
    const scale = this.state.scale;
    if (this.props.tickValues) {
      return this.props.tickValues;
    } else if (_.isFunction(scale.ticks)) {
      return scale.ticks(this.props.tickCount);
    } else {
      return scale.domain();
    }
  }

  getTickFormat() {
    const scale = this.state.scale;
    if (this.props.tickFormat) {
      return this.props.tickFormat;
    } else if (_.isFunction(scale.tickFormat)) {
      return scale.tickFormat(this.state.ticks.length);
    } else {
      return (x) => x;
    }
  }

  getAxisLine() {
    return this.isVertical() ?
      <line y1={_.min(this.state.range)} y2={_.max(this.state.range)}/> :
      <line x1={_.min(this.state.range)} x2={_.max(this.state.range)}/>;
  }

  getActiveScale(tick) {
    const scale = this.state.scale;
    if (scale.rangeBand) {
      return scale(tick) + scale.rangeBand() / 2;
    }
    return scale(tick);
  }

  getTickProperties() {
    const verticalAxis = this.isVertical();
    const tickSpacing = _.max([this.props.tickSize, 0]) + this.props.tickPadding;
    // determine axis orientation and layout
    const sign = this.props.orientation === "top" || this.props.orientation === "left" ? -1 : 1;
    // determine tick formatting constants based on orientationation and layout
    const x = verticalAxis ? sign * tickSpacing : 0;
    const y = verticalAxis ? 0 : sign * tickSpacing;
    const x2 = verticalAxis ? sign * this.props.tickSize : 0;
    const y2 = verticalAxis ? 0 : sign * this.props.tickSize;
    let dy;
    let textAnchor;
    if (verticalAxis) {
      dy = ".32em"; // code smell: magic numbers from d3
      textAnchor = sign < 0 ? "end" : "start";
    } else {
      dy = sign < 0 ? "0em" : ".71em"; // code smell: magic numbers from d3
      textAnchor = "middle";
    }
    return {x, y, x2, y2, dy, textAnchor};
  }


  getTickLines() {
    const verticalAxis = this.isVertical();
    const ticks = this.getTicks();
    const properties = this.getTickProperties();
    let position;
    let translate;
    // determine the position and translation of each tick
    return _.map(ticks, (tick, index) => {
      position = this.getActiveScale(tick);
      translate = verticalAxis ?
        "translate(0, " + position + ")" : "translate(" + position + ", 0)";
      return (
        <g key={"tick-" + index} transform={translate}>
          <line x2={properties.x2} y2={properties.y2}/>
          <text x={properties.x}
            y={properties.y}
            dy={properties.dy}
            textAnchor={properties.textAnchor}>
            {this.state.tickFormat(tick)}
          </text>
        </g>
      );
    });
  }

  getLabelElements() {
    const orientation = this.props.orientation;
    const sign = (orientation === "top" || orientation === "left") ? -1 : 1;
    const x = this.isVertical() ?
      -((this.props.height) / 2) :
      ((this.props.width) / 2);
    return (
      <text
        textAnchor="middle"
        y={sign * this.getLabelPadding()}
        x={x}
        transform={this.isVertical() ? "rotate(-90)" : ""}>
        {this.props.label}
      </text>
    );
  }

  render() {
    const styles = this.getStyles();
    return (
      <g>
        <g style={styles} transform={this.getTransform()}>
          {this.getAxisLine()}
          {this.getTickLines()}
          {this.getLabelElements()}
        </g>
      </g>
    );
  }
}

VictoryAxis.propTypes = {
  style: React.PropTypes.node,
  domain: React.PropTypes.array,
  range: React.PropTypes.array,
  orientation: React.PropTypes.oneOf(["top", "bottom", "left", "right"]),
  scale: React.PropTypes.func, // is this right, or should we pass a string?
  tickCount: React.PropTypes.number,
  tickValues: React.PropTypes.array,
  tickSize: React.PropTypes.number,
  tickPadding: React.PropTypes.number,
  tickFormat: React.PropTypes.func,
  label: React.PropTypes.string,
  labelPadding: React.PropTypes.number,
  width: React.PropTypes.number,
  height: React.PropTypes.number,
  offsetX: React.PropTypes.number,
  offsetY: React.PropTypes.number
};

VictoryAxis.defaultProps = {
  orientation: "bottom",
  scale: () => d3.scale.linear(),
  tickCount: 5,
  tickSize: 4,
  tickPadding: 3,
  width: 500,
  height: 300
};

export default VictoryAxis;
