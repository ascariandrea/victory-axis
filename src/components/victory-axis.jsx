import React from "react";
import Radium from "radium";
import d3 from "d3";
import _ from "lodash";
import log from "../log";
import {VictoryAnimation} from "victory-animation";

const styles = {
  parent: {
    width: 500,
    height: 300,
    margin: 50
  },
  axis: {
    stroke: "#756f6a",
    fill: "none",
    strokeWidth: 2,
    strokeLinecap: "round"
  },
  grid: {
    stroke: "#c9c5bb",
    fill: "none",
    strokeWidth: 0,
    strokeLinecap: "round"
  },
  ticks: {
    stroke: "#756f6a",
    fill: "none",
    padding: 5,
    strokeWidth: 2,
    strokeLinecap: "round",
    color: "#756f6a",
    size: 4
  },
  tickLabels: {
    stroke: "transparent",
    fill: "#756f6a",
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 5
  },
  axisLabels: {
    stroke: "transparent",
    fill: "#756f6a",
    fontSize: 16,
    fontFamily: "Helvetica"
  }
};

class VAxis extends React.Component {
  static propTypes = {
    /**
     * The style prop specifies styles for your chart. Victory Axis relies on Radium,
     * so valid Radium style objects should work for this prop, however height, width, and margin
     * are used to calculate range, and need to be expressed as a number of pixels.
     * styles for axis lines, gridlines, and ticks are scoped to separate props.
     * @examples {width: 500, height: 300, margin: 50, axis: {stroke: "#756f6a"},
     * grid: {stroke: "#c9c5bb"}, ticks: {stroke: "#756f6a", padding: 5},
     * tickLabels: {fontSize: 10, padding: 5}, axisLabels: {fontSize: 16, padding: 20}}
     */
    style: React.PropTypes.object,
    /**
     * The domain prop describes the range of values your axis will include. This prop should be
     * given as a array of the minimum and maximum expected values for your axis.
     * If this value is not given it will be calculated based on the scale or tickValues.
     * @exampes [-1, 1]
     */
    domain: React.PropTypes.array,
    /**
     * The range prop describes the range of pixels your axis will cover. This prop can be
     * given as a array of the minimum and maximum expected values for your axis area.
     * If this prop is not provided, a range will be calculated based on the height,
     * or width, and the margin provided in the style prop, or in default styles. It is usually
     * a good idea to let the chart component calculate its own range.
     * @exampes [0, 500]
     */
    range: React.PropTypes.arrayOf(React.PropTypes.number),
    /**
     * The orientation prop specifies the position and orientation of your axis.
     */
    orientation: React.PropTypes.oneOf(["top", "bottom", "left", "right"]),
    /**
     * The scale prop determines which scales your axis should use. This prop should be
     * given as a function,
     * @exampes d3.time.scale()
     */
    scale: React.PropTypes.func,
    /**
     * The tickCount prop specifies how many ticks should be drawn on the axis if
     * ticksValues are not explicitly provided.
     */
    tickCount: React.PropTypes.number,
    /**
     * The tickValues prop explicity specifies which ticks values to draw on the axis.
     * @examples ["apples", "bananas", "oranges"], [2, 4, 6, 8]
     */
    tickValues: React.PropTypes.array,
    /**
     * The tickFormat prop specifies how tick values should be expressed visually.
     * tickFormat can be given as a function to be applied to every tickValue, or as
     * an array of display values for each tickValue
     * @examples d3.time.format("%Y"), (x) => x.toPrecision(2), ["first", "second", "third"]
     */
    tickFormat: React.PropTypes.oneOfType([React.PropTypes.func, React.PropTypes.array]),
    /**
     * The label prop specifies the label for your axis
     */
    label: React.PropTypes.string,
    /**
     * The labelPadding prop specifies the padding in pixels for you axis label
     */
    labelPadding: React.PropTypes.number,
    /**
     * This value describes how far from the "edge" of it's permitted area each axis
     * will be set back in the x-direction.  If this prop is not given,
     * the offset is calculated based on font size, axis orientation, and label padding.
     */
    offsetX: React.PropTypes.number,
    /**
     * This value describes how far from the "edge" of it's permitted area each axis
     * will be set back in the y-direction.  If this prop is not given,
     * the offset is calculated based on font size, axis orientation, and label padding.
     */
    offsetY: React.PropTypes.number,
    /**
     * This value determines whether or not to draw gridlines for an axis. Note: gridlines
     * for an axis are drawn perpendicularly from each axis starting at the axis ticks.
     */
    crossAxis: React.PropTypes.bool,
    /**
     * The standalone prop determines whether the component will render a standalone svg
     * or a <g> tag that will be included in an external svg. Set standalone to false to
     * compose VictoryAxis with other components within an enclosing <svg> tag.
     */
    standalone: React.PropTypes.bool,
    /**
     * The animate prop specifies props for victory-animation to use. It this prop is
     * not given, the axis will not tween between changing data / style props.
     * Large datasets might animate slowly due to the inherent limits of svg rendering.
     * @examples {line: {delay: 5, velocity: 10, onEnd: () => alert("woo!")}}
     */
    animate: React.PropTypes.object
  };

  static defaultProps = {
    orientation: "bottom",
    scale: d3.scale.linear(),
    tickCount: 5,
    standalone: true
  };

  constructor(props) {
    super(props);
    this.getCalculatedValues(props);
  }

  componentWillReceiveProps(nextProps) {
    this.getCalculatedValues(nextProps);
  }

  getCalculatedValues(props) {
    // order matters!
    this.style = this.getStyles(props);
    this.isVertical = props.orientation === "left" || props.orientation === "right";
    this.stringMap = this.createStringMap(props);
    this.range = this.getRange(props);
    this.domain = this.getDomain(props);
    this.scale = this.getScale(props);
    this.ticks = this.getTicks(props);
    this.tickFormat = this.getTickFormat(props);
    this.labelPadding = this.getLabelPadding(props);
    this.offset = this.getOffset(props);
    this.tickProperties = this.getTickProperties(props);
    this.transform = this.getTransform(props);
  }

  getStyles(props) {
    if (!props.style) {
      return styles;
    }
    const {axis, grid, ticks, tickLabels, axisLabels, parent} = props.style;
    return {
      parent: _.merge({}, styles.parent, parent),
      axis: _.merge({}, styles.axis, axis),
      grid: _.merge({}, styles.grid, grid),
      ticks: _.merge({}, styles.ticks, ticks),
      tickLabels: _.merge({}, styles.tickLabels, tickLabels),
      axisLabels: _.merge({}, styles.axisLabels, axisLabels)
    };
  }

  createStringMap(props) {
    // if tickValues exist and are strings, create a map using only those strings
    // dont alter the order.
    const containsStrings = function (collection) {
      return _.some(collection, function (item) {
        return _.isString(item);
      });
    };

    if (props.tickValues && containsStrings(props.tickValues)) {
      return _.zipObject(_.map(props.tickValues, (tick, index) => {
        return ["" + tick, index + 1];
      }));
    }
  }

  getDomain(props) {
    let domain;
    if (props.domain) {
      domain = props.domain;
    } else if (props.tickValues) {
      domain = this._getDomainFromTickValues(props);
    } else {
      domain = this._getDomainFromScale(props);
    }
    return domain;
  }

  // helper for getDomain()
  _getDomainFromTickValues(props) {
    let domain;
    if (this.stringMap) {
      const values = _.values(this.stringMap);
      domain = [_.min(values), _.max(values)];
    } else {
      const ticks = _.map(props.tickValues, (value) => +value);
      // coerce ticks to numbers
      domain = [_.min(ticks), _.max(ticks)];
    }
    return this.isVertical ? domain.concat().reverse() : domain;
  }

  // helper for getDomain()
  _getDomainFromScale(props) {
    const scaleDomain = props.scale.domain();
    // Warn when domains need more information to produce meaningful axes
    if (_.isDate(scaleDomain[0])) {
      log.warn("please specify tickValues or domain when creating a time scale axis");
    } else if (scaleDomain.length === 0) {
      log.warn("please specify tickValues or domain when creating an axis using " +
        "ordinal or quantile scales");
    } else if (scaleDomain.length === 1) {
      log.warn("please specify tickValues or domain when creating an axis using " +
        "a threshold scale");
    }
    return this.isVertical ? scaleDomain.concat().reverse() : scaleDomain;
  }

  getRange(props) {
    if (props.range) {
      return props.range;
    }
    const style = this.style.parent;
    return this.isVertical ?
      [style.margin, style.height - style.margin] :
      [style.margin, style.width - style.margin];
  }

  getScale(props) {
    const scale = props.scale.copy();
    scale.range(this.range);
    scale.domain(this.domain);
    // hacky check for identity scale
    if (_.difference(scale.range(), this.range).length !== 0) {
      // identity scale, reset the domain and range
      scale.range(this.range);
      scale.domain(this.range);
      log.warn("Identity Scale: domain and range must be identical. " +
        "Domain has been reset to match range.");
    }
    return scale;
  }

  getTicks(props) {
    let t;
    if (this.stringMap) {
      t = _.values(this.stringMap);
    } else if (props.tickValues) {
      t = props.tickValues;
    } else if (_.isFunction(this.scale.ticks)) {
      const ticks = this.scale.ticks(props.tickCount);
      if (props.crossAxis) {
        t = _.includes(ticks, 0) ? _.without(ticks, 0) : ticks;
      } else {
        t = ticks;
      }
    } else {
      t = this.scale.domain();
    }
    return _.isArray(t) ? t : [t];
  }

  getTickFormat(props) {
    if (props.tickFormat && _.isFunction(props.tickFormat)) {
      return props.tickFormat;
    } else if (props.tickFormat && _.isArray(props.tickFormat)) {
      return (x, index) => props.tickFormat[index];
    } else if (this.stringMap) {
      const dataNames = _.keys(this.stringMap);
      // string ticks should have one tick of padding
      const dataTicks = ["", ...dataNames];
      return (x) => dataTicks[x];
    } else if (_.isFunction(this.scale.tickFormat())) {
      return this.scale.tickFormat(this.ticks.length);
    } else {
      return (x) => x;
    }
  }

  getLabelPadding(props) {
    if (this.style.axisLabels.padding) {
      return this.style.axisLabels.padding;
    }
    // TODO: magic numbers
    const fontSize = this.style.axisLabels.fontSize;
    return props.label ? (fontSize * 2.4) : 0;
  }

  getOffset(props) {
    const fontSize = this.style.axisLabels.fontSize;
    const offsetX = props.offsetX || this.style.parent.margin;
    const offsetY = props.offsetY || this.style.parent.margin;
    const totalPadding = fontSize +
      (2 * this.style.ticks.size) +
      this.labelPadding;
    const minimumPadding = 1.2 * fontSize; // TODO: magic numbers
    const x = this.isVertical ? totalPadding : minimumPadding;
    const y = this.isVertical ? minimumPadding : totalPadding;
    return {
      x: offsetX || x,
      y: offsetY || y
    };
  }

  getTickProperties(props) {
    const tickSpacing = _.max([this.style.ticks.size, 0]) +
      this.style.ticks.padding;
    // determine axis orientation and layout
    const sign = props.orientation === "top" || props.orientation === "left" ? -1 : 1;
    // determine tick formatting constants based on orientationation and layout
    const x = this.isVertical ? sign * tickSpacing : 0;
    const y = this.isVertical ? 0 : sign * tickSpacing;
    const x2 = this.isVertical ? sign * this.style.ticks.size : 0;
    const y2 = this.isVertical ? 0 : sign * this.style.ticks.size;
    let dy;
    let textAnchor;
    if (this.isVertical) {
      dy = ".32em"; // todo: magic numbers from d3
      textAnchor = sign < 0 ? "end" : "start";
    } else {
      dy = sign < 0 ? "0em" : ".71em"; // todo: magic numbers from d3
      textAnchor = "middle";
    }
    return {x, y, x2, y2, dy, textAnchor};
  }

  getTransform(props) {
    const transform = {
      top: [0, this.offset.y],
      bottom: [0, (this.style.parent.height - this.offset.y)],
      left: [this.offset.x, 0],
      right: [(this.style.parent.width - this.offset.x), 0]
    };
    return "translate(" + transform[props.orientation][0] + "," +
      transform[props.orientation][1] + ")";
  }

  getAxisLine() {
    const style = this.style.parent;
    const extent = {
      x: [style.margin, style.width - style.margin],
      y: [style.margin, style.height - style.margin]
    };
    return this.isVertical ?
      <line y1={_.min(extent.y)} y2={_.max(extent.y)} style={this.style.axis}/> :
      <line x1={_.min(extent.x)} x2={_.max(extent.x)} style={this.style.axis}/>;
  }

  getTickLines() {
    let position;
    let translate;
    let textLengthAndLines;
    // determine the position and translation of each tick
    return _.map(this.ticks, (tick, index) => {
      position = this.scale(tick);
      translate = this.isVertical ?
        "translate(0, " + position + ")" : "translate(" + position + ", 0)";
      textLengthAndLines =
        this.getTextLines(this.tickFormat.call(this, tick, index), this.tickProperties.x);
      return (
        <g key={"tick-" + index} transform={translate}>
          <line
            x2={this.tickProperties.x2}
            y2={this.tickProperties.y2}
            style={this.style.ticks}/>
          <text x={this.tickProperties.x}
            y={(this.tickProperties.y - textLengthAndLines[0])}
            dy={this.tickProperties.dy}
            style={this.style.tickLabels}
            textAnchor={this.tickProperties.textAnchor}>
            {textLengthAndLines[1]}
          </text>
        </g>
      );
    });
  }

  getGridLines() {
    const style = this.style.parent;
    const sign = this.props.orientation === "top" || this.props.orientation === "left" ? 1 : -1;
    const xOffset = this.props.crossAxis ? this.offset.x - style.margin : 0;
    const yOffset = this.props.crossAxis ? this.offset.y - style.margin : 0;
    const x2 = this.isVertical ? sign * (style.width - (2 * style.margin)) : 0;
    const y2 = this.isVertical ? 0 : sign * (style.height - (2 * style.margin));
    let position;
    let translate;
    // determine the position and translation of each gridline
    return _.map(this.ticks, (tick, index) => {
      position = this.scale(tick);
      translate = this.isVertical ?
        "translate(" + -xOffset + ", " + position + ")" :
        "translate(" + position + ", " + yOffset + ")";
      return (
        <g key={"grid-" + index} transform={translate}>
          <line
            x2={x2}
            y2={y2}
            style={this.style.grid}/>
        </g>
        );
    });
  }

  getTextLines(text, x) {
    if (!text) {
      return "";
    }
    // TODO: split text to new lines based on font size, number of characters and total width
    // TODO: determine line height ("1.2em") based on font size
    const textString = "" + text;
    const textLines = textString.split("\n");
    const HTMLtextLines = _.map(textLines, (line, index) => {
      return index === 0 ?
      (<tspan x={x} key={"text-line-" + index}>{line}</tspan>) :
      (<tspan x={x} dy="1.2em" key={"text-line-" + index}>{line}</tspan>);
    });
    const heightOfLines = this.props.orientation === "top" ?
     (textLines.length - 1) * this.style.tickLabels.fontSize * 1.25 : 0;
    return [heightOfLines, HTMLtextLines];
  }

  getLabelElements() {
    const style = this.style.parent;
    if (this.props.label) {
      const orientation = this.props.orientation;
      const sign = (orientation === "top" || orientation === "left") ? -1 : 1;
      const x = this.isVertical ? -((style.height) / 2) : ((style.width) / 2);
      return (
        <text
          textAnchor="middle"
          y={sign * this.labelPadding}
          x={x}
          style={this.style.axisLabels}
          transform={this.isVertical ? "rotate(-90)" : ""}>
          {this.getTextLines(this.props.label, x)[1]}
        </text>
      );
    }
  }

  render() {
    if (this.props.standalone === true) {
      return (
        <svg style={this.style.parent}>
          <g style={this.style.parent} transform={this.transform}>
            {this.getGridLines()}
            {this.getAxisLine()}
            {this.getTickLines()}
            {this.getLabelElements()}
          </g>
        </svg>
      );
    }
    return (
      <g style={this.style.parent} transform={this.transform}>
        {this.getGridLines()}
        {this.getAxisLine()}
        {this.getTickLines()}
        {this.getLabelElements()}
      </g>
    );
  }
}

@Radium
export default class VictoryAxis extends React.Component {
  /* eslint-disable react/prop-types */
  // ^ see: https://github.com/yannickcr/eslint-plugin-react/issues/106
  static propTypes = {...VAxis.propTypes};
  static defaultProps = {...VAxis.defaultProps};

  render() {
    if (this.props.animate) {
      // Do less work by having `VictoryAnimation` tween only values that
      // make sense to tween. In the future, allow customization of animated
      // prop whitelist/blacklist?
      const animateData = _.omit(this.props, [
        "orientation", "scale", "tickFormat", "animate",
        "crossAxis", "standalone"
      ]);
      return (
        <VictoryAnimation {...this.props.animate} data={animateData}>
          {props => <VAxis {...this.props} {...props}/>}
        </VictoryAnimation>
      );
    }
    return (<VAxis {...this.props}/>);
  }
}
