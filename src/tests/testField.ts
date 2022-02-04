import { FieldName, TranslationField } from "../translationField";

export class TestField extends TranslationField {
  constructor(field: TestFieldDefinition) {
    super(field.fieldname);
    if (this.params.control) {
      throw new Error(`Translation field ${this.name} is a control field!`);
    }
  }
}

interface TestFieldDefinition {
  fieldname: FieldName;
}
