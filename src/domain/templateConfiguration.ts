import { TemplateDefinition, TranslationTemplate } from "../templates/template";
import { DomainConfiguration } from "./domainConfiguration";

export class TemplateConfiguration extends DomainConfiguration<
  TranslationTemplate, TemplateDefinition
> {
  constructor(
    domain: string,
    configuration?: TemplateDefinition,
  ) {
    super(
      domain, 'templates.json', 'templates', configuration
    );
  }

  get() { return [] };

  add() { return new TranslationTemplate(this.domain, {'path': ''}) };

  move() { return };

  remove() { return };

  parse() { return [] };

  toJSON() { return {'path': ''} }
}

//   private _fallback: FallbackTemplate | undefined;

//   constructor(
//     templates?: Array<TemplateDefinition>
//     fallbackTemplate: FallbackTemplateDefinition | undefined,
//   ) {
//     if (definition && definition.templates) {
//       definition.templates.forEach((templateDef) => {
//         try {
//           this.addTemplate(templateDef);
//         } catch (e) {
//           if (e instanceof DuplicateTemplatePathError) {
//             // silently ignore duplicate template paths
//             log.info(
//               `Skipping duplicate templates for path ${templateDef.path}`
//             );
//           } else {
//             throw e;
//           }
//         }
//       });
//     }
//   }
//   // do I need these??

//   get templates() {
//     return Object.freeze([...this._templates]);
//   }

//   set templates(templates) {
//     throw new Error(
//       `Cannot set templates. Use add/move/removeTemplate methods instead`
//     );
//   }


//   /// fallback

//   get fallbackTemplate() {
//     if (this._fallbackTemplate !== undefined) {
//       return this._fallbackTemplate.toJSON();
//     }
//   }

//   set fallbackTemplate(definition: FallbackTemplateDefinition | undefined) {
//     if (definition === undefined) {
//       this._fallbackTemplate = undefined;
//     } else {
//       if ("path" in definition) {
//         throw new Error("Fallback template should not have template path");
//       }
//       this._fallbackTemplate = new FallbackTemplate(
//         this.domain,
//         definition,
//         config.forceRequiredFields
//       );
//     }
//   }





//     // fixme:
//   // running any of these should change the corresponding revid?
//   // beware: also mutating one of the templates, patterns, etc!!




//   addTemplate(
//     definition: TemplateDefinition,
//     index?: number
//   ): TranslationTemplate {
//     // create template instance before checking if path already exists
//     // because the template constructor may make changes to the path
//     const newTemplate = new TranslationTemplate(
//       this.domain,
//       definition,
//       config.forceRequiredFields
//     );
//     if (
//       this._templates.some((template) => template.path === newTemplate.path)
//     ) {
//       throw new DuplicateTemplatePathError(definition.path);
//     } else {
//       if (index !== undefined) {
//         this._templates.splice(index, 0, newTemplate);
//       } else {
//         this._templates.push(newTemplate);
//       }
//     }
//     return newTemplate;
//   }

//   getTemplate(path: string): TranslationTemplate | undefined {
//     const index = this._templates.findIndex(
//       (template) => template.path === path
//     );
//     const template = this._templates[index];
//     return template;
//   }

//   moveTemplate(path: string, newIndex: number): void {
//     const oldIndex = this._templates.findIndex(
//       (template) => template.path === path
//     );
//     const template = this._templates.splice(oldIndex, 1)[0];
//     if (template !== undefined) {
//       this._templates.splice(newIndex, 0, template);
//     }
//   }

//   removeTemplate(path: string): void {
//     const index = this._templates.findIndex(
//       (template) => template.path === path
//     );
//     if (index > -1) {
//       this._templates.splice(index, 1);
//       log.info(
//         `Template for path ${path} at index ${index} successfully removed`
//       );
//     } else {
//       log.info(`Could not remove template for path ${path}. No template found`);
//     }
//   }

//   async fetchTemplates(): Promise<void> {
//     // update templatesRevID

//     // Unknown field, selection and transformation types should be silently ignored so new versions can be tested without breaking old versions.
//     // Same with selection and transformation configuration values.
//     return;
//   }


//   // consider moving the translateWithTemplates method from template
//   // would be translateWithTemplatePaths


// }