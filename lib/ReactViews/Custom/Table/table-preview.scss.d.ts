declare namespace TablePreviewScssNamespace {
  export interface ITablePreviewScss {
    "table-td": string;
    tableTd: string;
  }
}

declare const TablePreviewScssModule: TablePreviewScssNamespace.ITablePreviewScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: TablePreviewScssNamespace.ITablePreviewScss;
};

export = TablePreviewScssModule;
