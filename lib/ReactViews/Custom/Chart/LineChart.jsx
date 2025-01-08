import { LinePath } from "@visx/shape";
import { line } from "d3-shape";
import PropTypes from "prop-types";
import React from "react";
import { observer } from "mobx-react";

@observer
class LineChart extends React.PureComponent {
  static propTypes = {
    id: PropTypes.string.isRequired,
    chartItem: PropTypes.object.isRequired,
    scales: PropTypes.object.isRequired,
    color: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number
  };

  doZoom(scales) {
    const el = document.querySelector(`#${this.props.id} path`);
    if (!el) return;
    const { chartItem } = this.props;
    const path = line()
      .x((p) => scales.x(p.x))
      .y((p) => scales.y(p.y));
    el.setAttribute("d", path(chartItem.points));
  }

  render() {
    const { chartItem, width, scales, color } = this.props;
    const stroke = color || chartItem.getColor();
    return (
      <g id={this.props.id} width={width}>
        <LinePath
          width={width}
          data={chartItem.points}
          x={(p) => scales.x(p.x)}
          y={(p) => scales.y(p.y)}
          stroke={stroke}
          strokeWidth={2}
        />
      </g>
    );
  }
}

export default LineChart;
