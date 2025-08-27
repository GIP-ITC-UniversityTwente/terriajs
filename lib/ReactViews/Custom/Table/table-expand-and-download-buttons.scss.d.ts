declare namespace TableExpandAndDownloadButtonsScssNamespace {
  export interface ITableExpandAndDownloadButtonsScss {
    "btn--dropdown": string;
    "btn-download": string;
    "btn-small": string;
    btnDownload: string;
    btnDropdown: string;
    btnSmall: string;
    dropdown: string;
    dropdownBtn: string;
    dropdownBtnOption: string;
    dropdownList: string;
    dropdown__btn: string;
    "dropdown__btn--option": string;
    dropdown__list: string;
  }
}

declare const TableExpandAndDownloadButtonsScssModule: TableExpandAndDownloadButtonsScssNamespace.ITableExpandAndDownloadButtonsScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: TableExpandAndDownloadButtonsScssNamespace.ITableExpandAndDownloadButtonsScss;
};

export = TableExpandAndDownloadButtonsScssModule;
