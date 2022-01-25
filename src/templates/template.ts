import { TargetUrl } from '../targetUrl';
import { Procedure } from './procedure';

class TranslationTemplate {
    domain: string;
    templateUrl: TargetUrl;  // name conflict
    label: string;
    procedures: Array<Procedure>;
    constructor(
        template: TemplateConfig
    )

    getProcedure(fieldName) // ?

    translate(target: TargetUrl): TranslationOutput;

}