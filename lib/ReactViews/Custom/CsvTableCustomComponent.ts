import CsvCatalogItem from "../../Models/Catalog/CatalogItems/CsvCatalogItem";
import CommonStrata from "../../Models/Definition/CommonStrata";
import { BaseModel } from "../../Models/Definition/Model";
import TableCustomComponent, {
  TableCustomComponentAttributes
} from "./TableCustomComponents";
import { ProcessNodeContext } from "./CustomComponent";

interface CsvTableCustomComponentAttributes
  extends TableCustomComponentAttributes {}

export default class CsvTableCustomComponent extends TableCustomComponent<CsvCatalogItem> {
  get name(): string {
    return "csvtable";
  }

  get attributes(): string[] {
    return super.attributes.concat([]);
  }

  protected constructCatalogItem(
    id: string | undefined,
    context: ProcessNodeContext,
    sourceReference: BaseModel | undefined
  ) {
    return context.terria
      ? new CsvCatalogItem(id, context.terria, sourceReference)
      : undefined;
  }

  protected setTraitsFromAttrs(
    item: CsvCatalogItem,
    attrs: CsvTableCustomComponentAttributes,
    sourceIndex: number
  ) {
    // Set url
    item.setTrait(
      CommonStrata.user,
      "url",
      attrs.sources && attrs.sources[sourceIndex]
    );

    // Set name
    let name = attrs.title;
    if (attrs.sourceNames && attrs.sourceNames[sourceIndex]) {
      name = `${name} - ${attrs.sourceNames[sourceIndex]}`;
    }
    item.setTrait(CommonStrata.user, "name", name);

    if (attrs.columnTitles !== undefined) {
      // Set column titles
      // there are 2 ways to set column title
      // if a {name, title} object is given, directly set the title on the column object
      // if a plain string is given, then we do not know the name of the column, so set the
      // title on the items `columnTitles` array.
      attrs.columnTitles.forEach((entry, colNumber) => {
        if (typeof entry === "string") {
          const titles = item.columnTitles.slice();
          titles[colNumber] = entry;
          item.setTrait(CommonStrata.user, "columnTitles", titles);
        } else {
          const { name, title } = entry;
          const column = item.addObject(CommonStrata.user, "columns", name)!;
          column.setTrait(CommonStrata.user, "title", title);
        }
      });
    }

    const chartStyle = item.addObject(CommonStrata.user, "styles", "csvtable")!;

    // Set chart axes
    if (attrs.xColumn || attrs.yColumns) {
      chartStyle.chart.setTrait(
        CommonStrata.user,
        "xAxisColumn",
        attrs.xColumn
      );

      (attrs.yColumns || []).forEach((y) => {
        const line = chartStyle.chart.addObject(CommonStrata.user, "lines", y)!;
        line.setTrait(CommonStrata.user, "isSelectedInWorkbench", false);
      });

      item.setTrait(CommonStrata.user, "activeStyle", "table");
    }
  }

  setTraitsFromBody = (item: CsvCatalogItem, csvString: string) => {
    item.setTrait(CommonStrata.user, "csvString", csvString);
  };

  protected parseNodeAttrs(nodeAttrs: {
    [name: string]: string | undefined;
  }): CsvTableCustomComponentAttributes {
    const parsed: CsvTableCustomComponentAttributes = super.parseNodeAttrs(
      nodeAttrs
    );
    return parsed;
  }

  constructDownloadUrlFromBody = (body: string) => {
    const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
    return URL.createObjectURL(blob);
  };
}
