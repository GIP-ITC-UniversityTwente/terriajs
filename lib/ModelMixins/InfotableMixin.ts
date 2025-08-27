import AbstractConstructor from "../Core/AbstractConstructor";
import Model from "../Models/Definition/Model";
import ModelTraits from "../Traits/ModelTraits";

export interface TableItem {
  id: string;
  name: string;
  key: string;
  item: Model<ModelTraits>;
  rows: string[];
  columns: string[];
}

type BaseType = Model<ModelTraits>;

function InfoTableMixin<T extends AbstractConstructor<BaseType>>(Base: T) {
  abstract class InfoTableMixin extends Base {
    get hasTableMixin() {
      return true;
    }
    abstract get tableItems(): TableItem[];
  }

  return InfoTableMixin;
}

namespace InfoTableMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof InfoTableMixin>> {}
  export function isMixedInto(model: any): model is Instance {
    return !!model?.hasTableMixin;
  }
}

export default InfoTableMixin;
