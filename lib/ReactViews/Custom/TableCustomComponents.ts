import { action, runInAction } from "mobx";
import React, { ReactElement } from "react";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import filterOutUndefined from "../../Core/filterOutUndefined";
import ChartableMixin from "../../ModelMixins/ChartableMixin";
import hasTraits from "../../Models/Definition/hasTraits";
import CommonStrata from "../../Models/Definition/CommonStrata";
import DiscretelyTimeVaryingTraits from "../../Traits/TraitsClasses/DiscretelyTimeVaryingTraits";
import LatLonHeight from "../../Core/LatLonHeight";
import { BaseModel } from "../../Models/Definition/Model";
import TerriaFeature from "../../Models/Feature/Feature";
import CustomComponent, {
  DomElement,
  ProcessNodeContext
} from "./CustomComponent";
import Table from "./Table/FeatureInfoPanelCsvTable";
import TableExpandAndDownloadButtons from "./Table/TableExpandAndDownloadButtons";

export interface TableCustomComponentAttributes {
  id?: string;
  title?: string;
  hideButtons?: boolean;
  sources?: string[];
  sourceNames?: string[];
  canDownload?: boolean;
  canExpand?: boolean;
  downloads?: string[];
  downloadNames?: string[];
  columnTitles?: ({ name: string; title: string } | string)[];
  columnUnits?: ({ name: string; units: string } | string)[];
  xColumn?: string;
  yColumn?: string;
  yColumns?: string[];
  src?: string;
  data?: string;
  type?: string;
}

export const TableAttributes = [
  "id",
  "title",
  "hide-buttons",
  "sources",
  "source-names",
  "can-download",
  "can-expand",
  "downloads",
  "download-names",
  "column-titles",
  "column-units",
  "x-column",
  "y-column",
  "y-columns",
  "src",
  "data",
  "type"
];

export function splitStringIfDefined(s: string | undefined) {
  return s !== undefined ? s.split(",") : undefined;
}

export default abstract class TableCustomComponent<
  CatalogItemType extends ChartableMixin.Instance
> extends CustomComponent {
  protected tableItemId?: string;

  get attributes(): Array<string> {
    return TableAttributes;
  }

  abstract get name(): string;

  shouldProcessNode(_context: ProcessNodeContext, node: DomElement): boolean {
    return (
      this.isTable(node) ||
      this.isFirstColumnOfChartRow(node) ||
      this.isSecondColumnOfChartRow(node)
    );
  }

  processNode(
    context: ProcessNodeContext,
    node: DomElement,
    children: ReactElement[],
    index: number
  ): ReactElement | undefined {
    if (this.isTable(node)) {
      return this.processTable(context, node, children, index);
    } else if (this.isFirstColumnOfChartRow(node)) {
      return this.processFirstColumn(context, node, children, index);
    } else if (this.isSecondColumnOfChartRow(node)) {
      return this.processSecondColumn(context, node, children, index);
    }
    throw new DeveloperError("processNode called unexpectedly.");
  }

  /**
   * Construct a download URL from the table body text.
   * This URL will be used to present a download link when other download
   * options are not specified for the table.
   *
   * See {@CsvChartCustomComponent} for an example implementation.
   *
   * @param body The body string.
   * @return URL to be passed as `href` for the download link.
   */
  protected constructDownloadUrlFromBody?: (body: string) => string;

  /**
   * For some catalog types, for the table item to be shareable, it needs to be
   * constructed as a reference to the original item. This method can be
   * overriden to make a shareable table. See SOSChartCustomComponent for an
   * implementation.
   *
   * This method is used only for constructing a table item to show
   * in the table panel, not for the feature info panel table item.
   */
  protected constructShareableCatalogItem?: (
    id: string | undefined,
    context: ProcessNodeContext,
    sourceReference: BaseModel | undefined
  ) => Promise<CatalogItemType | undefined> = undefined;

  /**
   * Used to construct a new catalog item to form the basis of the table.
   */
  protected abstract constructCatalogItem(
    id: string | undefined,
    context: ProcessNodeContext,
    sourceReference: BaseModel | undefined
  ): CatalogItemType | undefined;

  private processTable(
    context: ProcessNodeContext,
    node: DomElement,
    children: ReactElement[],
    _index: number
  ): ReactElement | undefined {
    if (
      node.attribs === undefined ||
      !context.terria ||
      !context.feature ||
      !context.catalogItem
    ) {
      return undefined;
    }

    checkAllPropertyKeys(node.attribs, this.attributes);

    const attrs = this.parseNodeAttrs(node.attribs);
    const child = children[0];
    const body: string | undefined =
      typeof child === "string" ? child : undefined;
    const tableElements = [];
    this.tableItemId = this.tableItemId ?? createGuid();

    // If downloads not specified but we have a body string, convert it to a downloadable data URI.
    if (
      attrs.downloads === undefined &&
      body &&
      this.constructDownloadUrlFromBody !== undefined
    ) {
      attrs.downloads = [this.constructDownloadUrlFromBody?.(body)];
    }

    if (!attrs.hideButtons) {
      // Build expand/download buttons
      const sourceItems = (attrs.downloads || attrs.sources || [""]).map(
        (source: string, i: number) => {
          const id = `${context.catalogItem!.uniqueId}:${
            attrs.title
          }:${source}`;

          const itemOrPromise = this.constructShareableCatalogItem
            ? this.constructShareableCatalogItem(id, context, undefined)
            : this.constructCatalogItem(id, context, undefined);

          return Promise.resolve(itemOrPromise).then(
            action((item) => {
              if (item) {
                this.setTraitsFromParent(item, context.catalogItem!);
                this.setTraitsFromAttrs(item, attrs, i);
                body && this.setTraitsFromBody?.(item, body);
              }
              return item;
            })
          );
        }
      );

      tableElements.push(
        React.createElement(TableExpandAndDownloadButtons, {
          key: "button",
          terria: context.terria,
          sourceItems: sourceItems,
          sourceNames: attrs.sourceNames,
          canDownload: attrs.canDownload === true,
          canExpand: attrs.canExpand == true,
          downloads: attrs.downloads,
          downloadNames: attrs.downloadNames,
          raiseToTitle: !!getInsertedTitle(node),
          catalogItem: context.catalogItem
        })
      );
    }

    // Build table item to show in the info panel
    const tableItem = this.constructCatalogItem(
      this.tableItemId,
      context,
      undefined
    );

    if (tableItem) {
      runInAction(() => {
        this.setTraitsFromParent(tableItem, context.catalogItem!);
        this.setTraitsFromAttrs(tableItem, attrs, 0);
        body && this.setTraitsFromBody?.(tableItem, body);
      });

      tableElements.push(
        React.createElement(Table, {
          key: "table-" + createGuid(),
          item: tableItem,
          height: 210,
          yColumn: attrs.yColumns?.[1],
          catalogItem: context.catalogItem
        })
      );
    }

    return React.createElement(
      "div",
      {
        key: "table-wrapper-" + createGuid(),
        css: `width: 100%`
      },
      tableElements
    );
  }

  /**
   * Parse node attrs to an easier to process structure.
   */
  protected parseNodeAttrs(nodeAttrs: {
    [name: string]: string | undefined;
  }): TableCustomComponentAttributes {
    let sources = splitStringIfDefined(nodeAttrs.sources);
    if (sources === undefined && nodeAttrs.src !== undefined) {
      // [src-preview, src], or [src] if src-preview is not defined.
      sources = [nodeAttrs.src];
      const srcPreview = nodeAttrs["src-preview"];
      if (srcPreview !== undefined) {
        sources.unshift(srcPreview);
      }
    }
    const sourceNames = splitStringIfDefined(nodeAttrs["source-names"]);
    const downloads = splitStringIfDefined(nodeAttrs.downloads) || sources;
    const downloadNames =
      splitStringIfDefined(nodeAttrs["download-names"]) || sourceNames;

    const columnTitles = filterOutUndefined(
      (nodeAttrs["column-titles"] || "").split(",").map((s) => {
        const [a, b] = rsplit2(s, ":");
        if (a && b) {
          return { name: a, title: b };
        } else {
          const title = a;
          return title;
        }
      })
    );

    const columnUnits = filterOutUndefined(
      (nodeAttrs["column-units"] || "").split(",").map((s) => {
        const [a, b] = rsplit2(s, ":");
        if (a && b) {
          return { name: a, units: b };
        } else {
          const units = a;
          return units;
        }
      })
    );

    const yColumns = splitStringIfDefined(
      nodeAttrs["y-columns"] || nodeAttrs["y-column"]
    );

    let obj = {
      id: nodeAttrs["id"],
      title: nodeAttrs["title"],
      hideButtons: nodeAttrs["hide-buttons"] === "true",
      sources: sources,
      sourceNames: sourceNames,
      canDownload: !(nodeAttrs["can-download"] === "false"),
      canExpand: !(nodeAttrs["can-expand"] === "false"),
      downloads,
      downloadNames,
      columnTitles,
      columnUnits,
      xColumn: nodeAttrs["x-column"],
      yColumns: yColumns
    };
    return obj;
  }

  /**
   * Is this node the table element itself?
   * @param node The node to test.
   */
  private isTable(node: DomElement): boolean {
    return node.name === this.name;
  }

  /**
   * Is this node the first column of a two-column table where the second
   * column contains a `<chart>`?
   * @param node The node to test
   */
  private isFirstColumnOfChartRow(node: DomElement): boolean {
    return (
      node.name === "td" &&
      node.children !== undefined &&
      node.children.length === 1 &&
      node.parent !== undefined &&
      node.parent.name === "tr" &&
      node.parent.children !== undefined &&
      node.parent.children.length === 2 &&
      node === node.parent.children[0] &&
      node.parent.children[1].name === "td" &&
      node.parent.children[1].children !== undefined &&
      node.parent.children[1].children.length === 1 &&
      node.parent.children[1].children[0].name === "csvtable"
    );
  }

  private processFirstColumn(
    _context: ProcessNodeContext,
    _node: DomElement,
    _children: ReactElement[],
    _index: number
  ): ReactElement | undefined {
    // Do not return a node.
    return undefined;
  }

  /**
   * Is this node the second column of a two-column table where the second
   * column contains a `<chart>`?
   * @param node The node to test
   */
  private isSecondColumnOfChartRow(node: DomElement): boolean {
    return (
      node.name === "td" &&
      node.children !== undefined &&
      node.children.length === 1 &&
      node.children[0].name === "csvtable" &&
      node.parent !== undefined &&
      node.parent.name === "tr" &&
      node.parent.children !== undefined &&
      node.parent.children.length === 2
    );
  }

  private processSecondColumn(
    _context: ProcessNodeContext,
    node: DomElement,
    children: ReactElement[],
    _index: number
  ): ReactElement | undefined {
    const title = node.parent!.children![0].children![0].data;
    const revisedChildren: ReactElement[] = [
      React.createElement(
        "div",
        {
          key: "title"
        },
        title
      ) as ReactElement
    ].concat(children);
    return React.createElement(
      "td",
      { key: "csvtable", colSpan: 2 },
      node.data,
      revisedChildren
    );
  }

  /**
   * Populate  traits in the supplied catalog item with the values from the body of the component.
   * Assume it will be run in an action.
   * @param item
   * @param attrs
   * @param sourceIndex
   */
  protected setTraitsFromBody?: (item: CatalogItemType, body: string) => void;

  protected setTraitsFromParent(
    chartItem: CatalogItemType,
    parentItem: BaseModel
  ) {
    if (
      hasTraits(chartItem, DiscretelyTimeVaryingTraits, "chartDisclaimer") &&
      hasTraits(parentItem, DiscretelyTimeVaryingTraits, "chartDisclaimer") &&
      parentItem.chartDisclaimer !== undefined
    ) {
      chartItem.setTrait(
        CommonStrata.user,
        "chartDisclaimer",
        parentItem.chartDisclaimer
      );
    }
  }

  /**
   * Populate the traits in the supplied catalog item with the values from the attributes of the component.
   * Assume it will be run in an action.
   * @param item
   * @param attrs
   * @param sourceIndex
   */
  protected abstract setTraitsFromAttrs(
    item: CatalogItemType,
    attrs: TableCustomComponentAttributes,
    sourceIndex: number
  ): void;
}

function checkAllPropertyKeys(object: any, allowedKeys: string[]) {
  for (const key in object) {
    if (Object.hasOwnProperty.call(object, key)) {
      if (allowedKeys.indexOf(key) === -1) {
        console.log("Unknown attribute " + key);
      }
    }
  }
}

function getFeaturePosition(feature?: TerriaFeature): LatLonHeight | undefined {
  const cartesian = feature?.position?.getValue(JulianDate.now());
  if (cartesian) {
    const carto = Ellipsoid.WGS84.cartesianToCartographic(cartesian);
    return {
      longitude: CesiumMath.toDegrees(carto.longitude),
      latitude: CesiumMath.toDegrees(carto.latitude)
    };
  }
}

/*
 * Split string `s` from last using `sep` into 2 pieces.
 */
function rsplit2(s: string, sep: string) {
  const pieces = s.split(sep);
  if (pieces.length === 1) {
    return pieces;
  } else {
    const head = pieces.slice(0, pieces.length - 1).join(sep);
    const last = pieces[pieces.length - 1];
    return [head, last];
  }
}

function getInsertedTitle(node: DomElement) {
  // Check if there is a title in the position 'Title' relative to node <chart>:
  // <tr><td>Title</td><td><chart></chart></tr>
  if (
    node.parent !== undefined &&
    node.parent.name === "td" &&
    node.parent.parent !== undefined &&
    node.parent.parent.name === "tr" &&
    node.parent.parent.children !== undefined &&
    node.parent.parent.children[0] !== undefined &&
    node.parent.parent.children[0].children !== undefined &&
    node.parent.parent.children[0].children[0] !== undefined
  ) {
    return node.parent.parent.children[0].children[0].data;
  }
}
