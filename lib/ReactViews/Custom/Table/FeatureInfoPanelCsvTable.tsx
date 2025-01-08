import { useParentSize } from "@visx/responsive";
import { computed, makeObservable } from "mobx";
import { observer } from "mobx-react";
import parseCustomHtmlToReact from "../parseCustomHtmlToReact";
import React, { useEffect, useState } from "react";
import Box from "../../../Styled/Box";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import ChartableMixin from "../../../ModelMixins/ChartableMixin";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import Styles from "./table-preview.scss";
import TableColumn from "../../../Table/TableColumn";

type CatalogItemType = ChartableMixin.Instance;

type FeatureInfoPanelTablePropTypes = {
  item: CatalogItemType;
  width?: number;
  height?: number;
  margin?: Margin;
  baseColor?: string;
  yColumn?: string;
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
 * Table component for feature info panel popup
 */
const FeatureInfoPanelCsvTable: React.FC<FeatureInfoPanelTablePropTypes> =
  observer((props) => {
    const [loadingFailed, setLoadingFailed] = useState(false);
    const { t } = useTranslation();

    const parentSize = useParentSize();
    const width = props.width || Math.max(parentSize.width, 300) || 0;
    const height = props.height || Math.max(parentSize.height, 300) || 0;

    const catalogItem: any = props.item;

    const tableColumns = catalogItem.tableColumns;

    const isLoading =
      !tableColumns &&
      MappableMixin.isMixedInto(catalogItem) &&
      catalogItem.isLoadingMapItems;
    const noData = !tableColumns || tableColumns.length == 0;

    const tableStatus = isLoading
      ? "chart.loading"
      : loadingFailed
      ? "chart.noData"
      : noData
      ? "chart.noData"
      : undefined;

    const canShowTable = tableStatus === undefined;

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
      <div className={Styles.tableTd} ref={parentSize.parentRef}>
        {!canShowTable && (
          <TableStatusText width={width} height={height}>
            {t(tableStatus)}
          </TableStatusText>
        )}
        {canShowTable && tableColumns && (
          <Table
            height={height}
            margin={margin}
            tableColumns={tableColumns}
            baseColor={baseColor}
            catalogItem={props.catalogItem}
          />
        )}
      </div>
    );
  });

interface TablePropsType {
  height: number;
  margin: Margin;
  tableColumns: TableColumn[];
  baseColor: string;
  catalogItem?: any;
}

/**
 * Private Table component
 */
@observer
class Table extends React.Component<TablePropsType> {
  xAxisHeight = 30;
  yAxisWidth = 10;

  constructor(props: TablePropsType) {
    super(props);
    makeObservable(this);
  }

  @computed
  get plot() {
    const { height, margin } = this.props;
    return {
      height: height - margin.top - margin.bottom - this.xAxisHeight
    };
  }

  render() {
    const { height, margin, tableColumns, baseColor } = this.props;

    const nr_columns = tableColumns.length;

    let nr_rows = 0;

    if (nr_columns > 0) {
      nr_rows = tableColumns[0].values.length;
    }

    let template = "<table>";
    template += `<thead><tr>`;
    template += tableColumns
      ?.map(
        (col) => `<th style="vertical-align: middle"><b>${col.title}</b></th>`
      )
      .join("");
    template += `</tr></thead>`;

    for (let i = 0; i < nr_rows; i++) {
      template += `<tr>`;
      for (let j = 0; j < nr_columns; j++) {
        let xValues = tableColumns[j].values;
        template += `<td>${xValues[i]}</td>`;
      }
      template += `</tr>`;
    }
    template += `</table>`;

    return (
      <Box
        css={`
          gap: 15px;
        `}
      >
        {parseCustomHtmlToReact(template)}
      </Box>
    );
  }
}

export const TableStatusText = styled.div<{ width: number; height: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${(p) => p.width}px;
  height: ${(p) => p.height}px;
`;

export const SpecCsvTable = Table;

export default FeatureInfoPanelCsvTable;
