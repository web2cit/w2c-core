import { TargetUrl } from '../targetUrl';
import { TranslationField, TranslationFieldDefinition } from './field';
import { TranslationProcedure } from './procedure';

class TranslationTemplate {
    domain: string;  // this may be needed to download template url caches
    templateUrl: TargetUrl;  // name conflict
    label: string;
    fieldProcedures: Array<TranslationField>;
    constructor(
        domain: string,
        template: TemplateDefinition
    ) {
        this.domain = domain;
        this.templateUrl = new TargetUrl(domain + template.path);
        this.label = template.label;
        this.fieldProcedures = template.procedures.map(
            (fieldProcedure) => {
                return new TranslationField(fieldProcedure)
            }
        );
    }

    async translate(target: TargetUrl): Promise<TranslationOutput> {
        const fieldOutputs = await Promise.all(
            this.fieldProcedures.map((field) => field.translate(target))
        );        
        return {
            fieldOutputs,
            timestamp: Date.now()
        }            
    }
}

interface TranslationOutput {
    // target URL

    // a series of FieldOutputs

    // a timestamp

    // an id (name?) of the template used?
}

interface TemplateDefinition {
    path: string;
    label: string;
    procedures: Array<TranslationFieldDefinition>
}