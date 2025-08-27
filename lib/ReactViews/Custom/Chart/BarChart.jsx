import PropTypes from "prop-types";
import React from "react";
import { observer } from "mobx-react";
import { Bar } from "@visx/shape";
import { scaleBand, scaleLinear } from "@visx/scale";

@observer
class BarChart extends React.PureComponent {
  static propTypes = {
    id: PropTypes.string.isRequired,
    chartItem: PropTypes.object.isRequired,
    scales: PropTypes.object.isRequired,
    color: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number
  };

  margin = { top: 0, right: 0, bottom: 0, left: 0 };

  constructor(props) {
    super(props);
  }

  componentDidMount() {}

  doZoom(scales) {
    const el = document.querySelector(`#${this.props.id} bar`);
    if (!el) return;
    const { chartItem, width, height } = this.props;
    // const path = line()
    //   .x((p) => scales.x(p.x))
    //   .y((p) => scales.y(p.y));
    // el.setAttribute("d", path(chartItem.points));
  }

  render() {
    const { chartItem, scales, color, width, height } = this.props;
    const fill = color || chartItem.getColor();

    let data = chartItem.points;

    let ys = [...new Set(data.map((pt) => pt.y))];
    let sorted = ys.sort((a, b) => a - b);

    let yMin = Math.round(sorted[0] / 4);
    sorted = sorted.toReversed();
    let yMax = Math.round(sorted[0]);

    if ((yMax - sorted[1]) / sorted[1] > 0.1) {
      yMax = Math.round(1.2 * sorted[1]);
    }

    let fillcolors;

    if (chartItem.chartOptions) {
      fillcolors = chartItem.chartOptions.xAxis?.colors;
    }

    const xScale = scaleBand({
      domain: data.map((d) => d.x),
      padding: 0.05,
      range: [0, width - this.margin.left - this.margin.right]
    });

    const yScale = scaleLinear({
      domain: [0, yMax],
      range: [height - this.margin.top - this.margin.bottom, 0]
    });

    return (
      <g id={this.props.id}>
        {data.map((d, idx) => (
          <Bar
            key={"bar-" + this.props.id + "-" + idx}
            y={yScale(d.y)}
            x={xScale(d.x)}
            width={xScale.bandwidth()}
            height={height - this.margin.top - this.margin.bottom - yScale(d.y)}
            fill={fillcolors ? fillcolors[idx] : fill}
            stroke="white"
            strokeWidth={1}
          />
        ))}
      </g>
    );
  }
}

export default BarChart;
