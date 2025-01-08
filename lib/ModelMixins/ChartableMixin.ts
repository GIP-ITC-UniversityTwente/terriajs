import { maxBy, minBy } from "lodash-es";
import AbstractConstructor from "../Core/AbstractConstructor";
import LatLonHeight from "../Core/LatLonHeight";
import { getMax, getMin } from "../Core/math";
import Model from "../Models/Definition/Model";
import { GlyphStyle } from "../ReactViews/Custom/Chart/Glyphs";
import ModelTraits from "../Traits/ModelTraits";
import { TableItem } from "./InfotableMixin";

type Scale = "linear" | "time" | "band";

export interface ChartAxis {
  name: string;
  scale: Scale;
  units?: string;
}

export interface ChartDomain {
  x: (number | Date | string)[];
  y: number[];
}

export function calculateDomain(
  points: ChartPoint[],
  scale: string
): ChartDomain {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const asNum = (x: Date | number | string) =>
    x instanceof Date ? x.getTime() : scale == "linear" ? parseInt("" + x) : x;
  return {
    x: scale === "band" ? xs : [minBy(xs, asNum) ?? 0, maxBy(xs, asNum) ?? 0],
    y: [getMin(ys) ?? 0, getMax(ys) ?? 0]
  };
}

export function axesMatch(a1: ChartAxis, a2: ChartAxis) {
  // ignore unit label if both scales are time
  if (a1.scale === "time" && a2.scale === "time") return true;
  else return a1.scale === a2.scale && a1.units === a2.units;
}

export type ChartItemType =
  | "bar"
  | "line"
  | "momentLines"
  | "momentPoints"
  | "lineAndPoint";

export interface ChartPoint {
  x: number | Date | string;
  y: number;
  isSelected?: boolean;
}

/**
 * Describes a quantity that can be rendered on the chart along its y-axis.
 */
export interface ChartItem {
  // id of the chart item - for table mixins this is the same a the id of the column
  id: string;
  name: string;
  categoryName?: string;
  key: string;
  item: Model<ModelTraits>;
  type: ChartItemType;
  units?: string;
  showInChartPanel: boolean;
  isSelectedInWorkbench: boolean;
  xAxis: ChartAxis;
  points: ChartPoint[];
  domain: ChartDomain;
  getColor: () => string; // Gets the color representing the chart item
  updateIsSelectedInWorkbench: (isSelected: boolean) => void; // Unselect the chart item in workbench
  onClick?: any;
  pointOnMap?: LatLonHeight;
  glyphStyle?: GlyphStyle;
  chartOptions?: any;
}

type BaseType = Model<ModelTraits>;

function ChartableMixin<T extends AbstractConstructor<BaseType>>(Base: T) {
  abstract class ChartableMixin extends Base {
    chartOptions: any;

    get hasChartableMixin() {
      return true;
    }

    get isChartable() {
      return true;
    }

    /**
     * Gets the items to show on a chart.
     */
    abstract get chartItems(): ChartItem[];

    get tableItems(): TableItem[] {
      return this.chartItems.map((chartItem) => {
        return {
          id: chartItem.id,
          name: chartItem.name,
          key: chartItem.key,
          item: chartItem.item,
          columns: chartItem.points.map((item) => "" + item.y),
          rows: []
        };
      });
    }
  }

  return ChartableMixin;
}

namespace ChartableMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof ChartableMixin>> {}
  export function isMixedInto(model: any): model is Instance {
    return !!model?.hasChartableMixin;
  }
}

export default ChartableMixin;
