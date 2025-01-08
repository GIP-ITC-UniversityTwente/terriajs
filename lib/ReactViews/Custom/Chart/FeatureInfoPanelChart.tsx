import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { useParentSize } from "@visx/responsive";
import { scaleBand, scaleLinear, scaleTime } from "@visx/scale";
import { computed, makeObservable } from "mobx";
import { observer } from "mobx-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import ChartableMixin, {
  ChartItem,
  ChartItemType
} from "../../../ModelMixins/ChartableMixin";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import BarChart from "./BarChart";
import LineChart from "./LineChart";
import Styles from "./chart-preview.scss";

type CatalogItemType = ChartableMixin.Instance;

type FeatureInfoPanelChartPropTypes = {
  chartType?: string;
  item: CatalogItemType;
  width?: number;
  height?: number;
  xAxisLabel?: string;
  yColumn?: string;
  margin?: Margin;
  baseColor?: string;
  catalogItem: any;
};

interface Margin {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

const defaultMargin: Margin = { top: 5, left: 5, right: 5, bottom: 5 };

/**
 * Chart component for feature info panel popup
 */
const FeatureInfoPanelChart: React.FC<FeatureInfoPanelChartPropTypes> =
  observer((props) => {
    const [loadingFailed, setLoadingFailed] = useState(false);
    const { t } = useTranslation();

    const parentSize = useParentSize();
    const width = props.width || Math.max(parentSize.width, 300) || 0;
    const height = props.height || Math.max(parentSize.height, 300) || 0;

    const catalogItem = props.item;

    // If a yColumn is specified, use it if it is of line type, otherwise use
    // the first line type chart item.
    let chartItem = props.yColumn
      ? catalogItem.chartItems.find((it) => it.id === props.yColumn)
      : catalogItem.chartItems.find(isLineType);
    // chartItem = chartItem && isLineType(chartItem) ? chartItem : undefined;

    const notChartable = !ChartableMixin.isMixedInto(catalogItem);
    const isLoading =
      !chartItem &&
      MappableMixin.isMixedInto(catalogItem) &&
      catalogItem.isLoadingMapItems;
    const noData = !chartItem || chartItem.points.length === 0;

    // Text to show when chart is not ready or available
    const chartStatus = notChartable
      ? "chart.noData"
      : isLoading
      ? "chart.loading"
      : loadingFailed
      ? "chart.noData"
      : noData
      ? "chart.noData"
      : undefined;

    const canShowChart = chartStatus === undefined;
    const margin = { ...defaultMargin, ...props.margin };
    const baseColor = props.baseColor ?? "#efefef";

    useEffect(() => {
      if (MappableMixin.isMixedInto(catalogItem)) {
        catalogItem.loadMapItems().then((result) => {
          setLoadingFailed(result.error !== undefined);
          result.logError();
        });
      } else {
        setLoadingFailed(false);
      }
    }, [catalogItem]);

    return (
      <div className={Styles.previewChart} ref={parentSize.parentRef}>
        {!canShowChart && (
          <ChartStatusText width={width} height={height}>
            {t(chartStatus)}
          </ChartStatusText>
        )}
        {canShowChart && chartItem && (
          <Chart
            chartType={props.chartType}
            width={width}
            height={height}
            margin={margin}
            chartItem={chartItem}
            baseColor={baseColor}
            xAxisLabel={props.xAxisLabel}
            catalogItem={props.catalogItem}
          />
        )}
      </div>
    );
  });

const isLineType = (chartItem: ChartItem) =>
  chartItem.type === "line" || chartItem.type === "lineAndPoint";

interface ChartPropsType {
  width: number;
  height: number;
  margin: Margin;
  chartItem: ChartItem;
  baseColor: string;
  xAxisLabel?: string;
  chartType?: string;
  catalogItem?: any;
}

/**
 * Private Chart component that renders the SVG chart
 */
@observer
class Chart extends React.Component<ChartPropsType> {
  xAxisHeight = 30;
  yAxisWidth = 10;

  constructor(props: ChartPropsType) {
    super(props);
    makeObservable(this);
  }

  @computed
  get plot() {
    const { width, height, margin } = this.props;
    return {
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom - this.xAxisHeight
    };
  }

  @computed
  get xScale() {
    const chartItem = this.props.chartItem;
    const xAxis = chartItem.xAxis;
    const domain = chartItem.domain.x;
    if (xAxis.scale === "linear") {
      return scaleLinear({
        domain: [
          parseInt(domain[0].toString()),
          parseInt(domain[1].toString())
        ],
        range: [0, this.plot.width]
      }).nice();
    }
    if (xAxis.scale === "band") {
      return scaleBand({
        domain: domain,
        range: [0, this.plot.width]
      });
    } else
      return scaleTime({
        domain: [
          parseInt(domain[0].toString()),
          parseInt(domain[1].toString())
        ],
        range: [0, this.plot.width]
      }).nice();
  }

  @computed
  get yScale() {
    const chartItem = this.props.chartItem;
    const yScaleParams = {
      domain: chartItem.domain.y,
      range: [this.plot.height, 0]
    };
    return scaleLinear(yScaleParams);
  }

  @computed
  get scales() {
    return {
      x: this.xScale,
      y: this.yScale
    };
  }

  render() {
    const {
      width,
      height,
      margin,
      chartItem,
      baseColor,
      chartType,
      catalogItem
    } = this.props;

    // Make sure points are asc sorted by x value
    //

    let chartOptions;
    let customProperties = catalogItem.customProperties;
    if (customProperties?.charts) {
      chartOptions = customProperties.charts[0];
      chartItem.chartOptions = chartOptions;
    }

    chartItem.type = (chartType as ChartItemType) ?? chartItem.type;

    const id = `featureInfoPanelChart-${chartItem.name}`;
    const textStyle = {
      fill: baseColor,
      fontSize: 10,
      textAnchor: "middle" as const,
      fontFamily: "Arial"
    };

    const chartLabel =
      this.props.xAxisLabel ??
      defaultChartLabel({
        xName: chartItem.xAxis.name,
        xUnits: chartItem.xAxis.units,
        yName: chartItem.name,
        yUnits: chartItem.units
      });

    return (
      <svg width={width} height={height}>
        <Group top={margin.top} left={margin.left}>
          <AxisBottom
            top={this.plot.height + 1}
            scale={this.xScale}
            numTicks={4}
            stroke="#a0a0a0"
            tickStroke="#a0a0a0"
            tickLabelProps={(_value, i, ticks) => {
              // To prevent the first and last values from getting clipped,
              // we position the first label text to start at the tick position
              // and the last label text to finish at the tick position. For all
              // others, middle of the text will coincide with the tick position.
              const textAnchor =
                i === 0 ? "start" : i === ticks.length - 1 ? "end" : "middle";
              return {
                ...textStyle,
                textAnchor
              };
            }}
            label={chartLabel}
            labelOffset={3}
            labelProps={textStyle}
          />
          <AxisLeft
            scale={this.scales.y}
            numTicks={4}
            stroke="none"
            tickStroke="none"
            tickLabelProps={() => ({
              ...textStyle,
              textAnchor: "start",
              dx: "1em",
              dy: "0"
            })}
          />
          <Plot
            id={id}
            chartItem={chartItem}
            baseColor={baseColor}
            scales={this.scales}
            width={this.plot.width}
            height={this.plot.height}
          />
        </Group>
      </svg>
    );
  }
}

interface PlotPropsType {
  id: string;
  width?: number;
  height?: number;
  chartItem: any;
  baseColor?: string;
  scales: any;
}

@observer
class Plot extends React.Component<PlotPropsType> {
  constructor(props: PlotPropsType) {
    super(props);
  }

  render() {
    const { id, chartItem, scales, width, height, baseColor } = this.props;

    switch (chartItem.type) {
      case "line":
        return (
          <LineChart
            id={id}
            chartItem={chartItem}
            scales={scales}
            color={baseColor}
          />
        );
      case "bar":
        return (
          <BarChart
            id={id}
            chartItem={chartItem}
            scales={scales}
            color={baseColor}
            width={width}
            height={height}
          />
        );
    }
  }
}

export const ChartStatusText = styled.div<{ width: number; height: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${(p) => p.width}px;
  height: ${(p) => p.height}px;
`;

const defaultChartLabel = (opts: {
  xName: string;
  xUnits?: string;
  yName: string;
  yUnits?: string;
}) =>
  `${withUnits(opts.yName, opts.yUnits)} x ${withUnits(
    opts.xName,
    opts.xUnits
  )}`;

const withUnits = (name: string, units?: string) =>
  units ? `${name} (${units})` : name;

// export Chart for use in specs
export const SpecChart = Chart;

export default FeatureInfoPanelChart;
