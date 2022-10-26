import { TranslationField } from "./translationField";

it("validation rejects partial-match output values (T311519)", () => {
  const field = new TranslationField("itemType");
  const output = ["newspaperArticle,newspapeArticle"];
  expect(field.validate(output)).toBe(false);
});
