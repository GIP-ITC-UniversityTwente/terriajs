import anyTrait from "../Decorators/anyTrait";
import objectTrait from "../Decorators/objectTrait";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import { traitClass } from "../Trait";
import AutoRefreshingTraits from "./AutoRefreshingTraits";
import TableTraits from "./Table/TableTraits";
import UrlTraits from "./UrlTraits";

class PollingTraits extends ModelTraits {
  @primitiveTrait({
    name: "Seconds",
    description: "Time in seconds to wait before polling for new data.",
    type: "number"
  })
  seconds?: number;

  @primitiveTrait({
    name: "url",
    description:
      "The URL to poll for new data. If undefined, uses the catalog item `url` if there is one.",
    type: "string"
  })
  url?: string;

  @primitiveTrait({
    name: "shouldReplaceData",
    description:
      "If true, the new data replaces the existing data, otherwise the new data will be appended to the old data.",
    type: "boolean"
  })
  shouldReplaceData = true;
}

export class CsvAvailableDimensionTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Dimension Name",
    description: "The name of the dimension."
  })
  name?: string;

  @primitiveArrayTrait({
    type: "string",
    name: "Dimension values",
    description: "Possible dimension values."
  })
  values?: string[];

  @primitiveTrait({
    type: "string",
    name: "Units",
    description: "The units of the dimension."
  })
  units?: string;

  @primitiveTrait({
    type: "string",
    name: "Unit Symbol",
    description: "The unitSymbol of the dimension."
  })
  unitSymbol?: string;

  @primitiveTrait({
    type: "string",
    name: "Default",
    description: "The default value for the dimension."
  })
  default?: string;

  @primitiveTrait({
    type: "boolean",
    name: "Multiple Values",
    description: "Can the dimension support multiple values."
  })
  multipleValues?: boolean;

  @primitiveTrait({
    type: "boolean",
    name: "Nearest Value",
    description: "The nearest value of the dimension."
  })
  nearestValue?: boolean;
}

export class CsvAvailableLayerDimensionsTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Layer Name",
    description: "The name of the layer for which dimensions are available."
  })
  layerName?: string;

  @objectArrayTrait({
    type: CsvAvailableDimensionTraits,
    name: "Dimensions",
    description: "The dimensions available for this layer.",
    idProperty: "name"
  })
  dimensions?: CsvAvailableDimensionTraits[];
}

@traitClass({
  description: `Creates one catalog item from url that points to a CSV file that contains geospatial data.`,
  example: {
    type: "csv",
    url: "https://tiles.terria.io/static/auspost-locations.csv",
    name: "Australia Post Locations",
    id: "some unique ID"
  }
})
export default class CsvCatalogItemTraits extends mixTraits(
  AutoRefreshingTraits,
  UrlTraits,
  TableTraits
) {
  @primitiveTrait({
    name: "Character Set",
    description:
      "The character set of the CSV data, overriding the information provided by the server, if any.",
    type: "string"
  })
  characterSet?: string;

  @primitiveTrait({
    name: "CSV Data",
    description: "The actual CSV data, represented as a string.",
    type: "string"
  })
  csvString?: string;

  @primitiveTrait({
    name: "Ignore rows starting with comment",
    description:
      "Any rows of a CSV starting with '#' or '//' will be ignored. A value of `undefined` will be treated the same as `false`.",
    type: "boolean"
  })
  ignoreRowsStartingWithComment?: boolean;

  @objectTrait({
    name: "Polling",
    description: "Polling configuration",
    type: PollingTraits
  })
  polling?: PollingTraits;

  @primitiveTrait({
    type: "boolean",
    name: "Disable dimension selectors",
    description: "When true, disables the dimension selectors in the workbench."
  })
  disableDimensionSelectors = false;

  @anyTrait({
    name: "Dimensions",
    description:
      "Dimension parameters used to request a new version of the CSV data."
  })
  dimensions?: { [key: string]: string };

  @objectArrayTrait({
    type: CsvAvailableLayerDimensionsTraits,
    name: "Available Dimensions",
    description: "The available dimensions.",
    idProperty: "layerName"
  })
  availableDimensions?: CsvAvailableLayerDimensionsTraits[];
}
