import i18next from "i18next";
import { computed, makeObservable, override, runInAction } from "mobx";
import combine from "terriajs-cesium/Source/Core/combine";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import isDefined from "../../../Core/isDefined";
import TerriaError from "../../../Core/TerriaError";
import AutoRefreshingMixin from "../../../ModelMixins/AutoRefreshingMixin";
import TableMixin from "../../../ModelMixins/TableMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import Csv from "../../../Table/Csv";
import TableAutomaticStylesStratum from "../../../Table/TableAutomaticStylesStratum";
import CsvCatalogItemTraits from "../../../Traits/TraitsClasses/CsvCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import { BaseModel } from "../../Definition/Model";
import StratumOrder from "../../Definition/StratumOrder";
import HasLocalData from "../../HasLocalData";
import Terria from "../../Terria";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import SelectableDimensions, {
  SelectableDimensionEnum
} from "../../SelectableDimensions/SelectableDimensions";

// Types of CSVs:
// - Points - Latitude and longitude columns or address
// - Regions - Region column
// - Chart - No spatial reference at all
// - Other geometry - e.g. a WKT column

// Types of time varying:
// - ID+time column -> point moves, region changes (continuously?) over time
// - points, no ID, time -> "blips" with a duration (perhaps provided by another column)
//
export default class CsvCatalogItem
  extends AutoRefreshingMixin(
    TableMixin(UrlMixin(CreateModel(CsvCatalogItemTraits)))
  )
  implements HasLocalData, SelectableDimensions
{
  static get type() {
    return "csv";
  }

  private _csvFile?: File;

  private _apiUrl?: string;

  constructor(
    id: string | undefined,
    terria: Terria,
    sourceReference: BaseModel | undefined
  ) {
    super(id, terria, sourceReference);
    makeObservable(this);
    this.strata.set(
      TableAutomaticStylesStratum.stratumName,
      new TableAutomaticStylesStratum(this)
    );
  }

  get type() {
    return CsvCatalogItem.type;
  }

  setFileInput(file: File) {
    this._csvFile = file;
  }

  setApiUrl(url: string) {
    this._apiUrl = url;
  }

  @computed
  get hasLocalData(): boolean {
    return isDefined(this._csvFile);
  }

  @override
  get _canExportData() {
    return (
      isDefined(this._csvFile) ||
      isDefined(this.csvString) ||
      isDefined(this.url)
    );
  }

  @override
  get cacheDuration() {
    return super.cacheDuration || "1d";
  }

  protected async _exportData() {
    if (isDefined(this._csvFile)) {
      return {
        name: (this.name || this.uniqueId)!,
        file: this._csvFile
      };
    }
    if (isDefined(this.csvString)) {
      return {
        name: (this.name || this.uniqueId)!,
        file: new Blob([this.csvString])
      };
    }

    if (isDefined(this.url)) {
      return this.url;
    }

    throw new TerriaError({
      sender: this,
      message: "No data available to download."
    });
  }

  /*
   * The polling URL to use for refreshing data.
   */
  @computed get refreshUrl() {
    return this.polling.url || this.url;
  }

  /*
   * Called by AutoRefreshingMixin to get the polling interval
   */
  @override
  get refreshInterval() {
    if (this.refreshUrl) {
      return this.polling.seconds;
    }
  }

  /*
   * Hook called by AutoRefreshingMixin to refresh data.
   *
   * The refresh happens only if a `refreshUrl` is defined.
   * If `shouldReplaceData` is true, then the new data replaces current data,
   * otherwise new data is appended to current data.
   */
  refreshData() {
    if (!this.refreshUrl) {
      return;
    }

    console.log(this.polling.url, this._apiUrl, this.refreshUrl);

    Csv.parseUrl(
      proxyCatalogItemUrl(this, this.refreshUrl),
      true,
      this.ignoreRowsStartingWithComment
    ).then((dataColumnMajor) => {
      runInAction(() => {
        if (this.polling.shouldReplaceData) {
          this.dataColumnMajor = dataColumnMajor;
        } else {
          this.append(dataColumnMajor);
        }
      });
    });
  }

  refreshDataFromApi() {
    if (!this._apiUrl) {
      return;
    }

    Csv.parseUrl(
      proxyCatalogItemUrl(this, this._apiUrl),
      true,
      this.ignoreRowsStartingWithComment
    ).then((dataColumnMajor) => {
      runInAction(() => {
        this.dataColumnMajor = dataColumnMajor;
      });
    });
  }

  protected forceLoadTableData(): Promise<string[][]> {
    if (this.csvString !== undefined) {
      return Csv.parseString(
        this.csvString,
        true,
        this.ignoreRowsStartingWithComment
      );
    } else if (this._csvFile !== undefined) {
      return Csv.parseFile(
        this._csvFile,
        true,
        this.ignoreRowsStartingWithComment
      );
    } else if (this.url !== undefined) {
      let itemUrl = this.url;
      if (isDefined(this.dimensions)) {
        const query = Object.entries(this.dimensions)
          .map(
            ([key, value]) =>
              `${key.toLowerCase()}=${encodeURIComponent(String(value))}`
          )
          .join("&");
        const separator = this.url?.includes("?") ? "&" : "?";
        itemUrl = `${this.url}${separator}${query}`;
      }
      return Csv.parseUrl(
        proxyCatalogItemUrl(this, itemUrl),
        true,
        this.ignoreRowsStartingWithComment
      );
    } else {
      return Promise.reject(
        new TerriaError({
          sender: this,
          title: i18next.t("models.csv.unableToLoadItemTitle"),
          message: i18next.t("models.csv.unableToLoadItemMessage")
        })
      );
    }
  }

  @computed
  get csvDimensionSelectableDimensions(): SelectableDimensionEnum[] {
    const dimensions: SelectableDimensionEnum[] = [];

    // For each layer -> For each dimension
    this.availableDimensions.forEach((layer) => {
      layer.dimensions.forEach((dim) => {
        // Only add dimensions if hasn't already been added (multiple layers may have the same dimension)
        if (
          !isDefined(dim.name) ||
          dim.values.length < 2 ||
          dimensions.findIndex((findDim) => findDim.name === dim.name) !== -1
        ) {
          return;
        }

        dimensions.push({
          name: dim.name,
          title: dim.title, // Use dimension title if available
          id: `${this.uniqueId}-${dim.name}`,
          options: dim.values.map((value) => {
            let name = value;
            // Add units and unitSybol if defined
            if (typeof dim.units === "string" && dim.units !== "") {
              if (typeof dim.unitSymbol === "string" && dim.unitSymbol !== "") {
                name = `${value} (${dim.units} ${dim.unitSymbol})`;
              } else {
                name = `${value} (${dim.units})`;
              }
            }
            return {
              name,
              id: value
            };
          }),

          // Set selectedId to value stored in `dimensions` trait, the default value, or the first available value
          selectedId:
            this.dimensions?.[dim.name]?.toString() ||
            dim.default ||
            dim.values[0],

          setDimensionValue: (
            stratumId: string,
            newDimension: string | undefined
          ) => {
            let newDimensions: any = {};

            newDimensions[dim.name!] = newDimension;

            if (isDefined(this.dimensions)) {
              newDimensions = combine(newDimensions, this.dimensions);
            }
            runInAction(() => {
              this.setTrait(stratumId, "dimensions", newDimensions);
              const query = Object.entries(newDimensions)
                .map(
                  ([key, value]) =>
                    `${key.toLowerCase()}=${encodeURIComponent(String(value))}`
                )
                .join("&");
              const separator = this.url?.includes("?") ? "&" : "?";
              this.setApiUrl(`${this.url}${separator}${query}`);
              this.refreshDataFromApi();
            });
          }
        });
      });
    });

    return dimensions;
  }

  @override
  get selectableDimensions() {
    if (this.disableDimensionSelectors) {
      return super.selectableDimensions;
    }

    return filterOutUndefined([
      ...super.selectableDimensions,
      ...this.csvDimensionSelectableDimensions
    ]);
  }
}

StratumOrder.addLoadStratum(TableAutomaticStylesStratum.stratumName);
