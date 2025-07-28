import FormDataProcessor from "./FormDataProcessor.js";
class BaseDataTransformer {
    constructor(creatFormInstance) {
        this.creatFormInstance = creatFormInstance;
        this.processor = new FormDataProcessor(creatFormInstance);
        this.config = creatFormInstance?.config || {};
        this.language = this.config.language || 'fr';
    }
    /**
     * Main transformation method - no more flatData!
     */
    transform(originalFormValues) {
        console.log('BaseDataTransformer: Starting transformation...', {
            originalFormValues
        });
        // Process form data using field configurations (same as CustomField)
        const processedData = this.processor.processFormData(originalFormValues);
        // Create structured format
        return {
            submissionType: this.getSubmissionType(),
            formVersion: this.getFormVersion(),
            submissionTimestamp: new Date()
                .toISOString(),
            language: this.language,
            // Create sections using processed data
            sections: this.processor.createSections(processedData),
            // Keep processed field data for direct access
            processedFields: processedData,
            // Add metadata
            metadata: this.generateMetadata(originalFormValues, processedData)
        };
    }
    /**
     * Generate metadata
     */
    generateMetadata(originalFormValues, processedData) {
        return {
            transformationTimestamp: new Date()
                .toISOString(),
            transformerType: this.constructor.name,
            totalFields: Object.keys(originalFormValues)
                .length,
            processedFields: Object.keys(processedData)
                .length,
            completionPercentage: this.calculateCompletionPercentage(originalFormValues),
            formStructure: this.determineFormStructure()
        };
    }
    /**
     * Calculate completion percentage
     */
    calculateCompletionPercentage(formValues) {
        const fieldConfigs = this.processor.getFieldConfigurations();
        const totalFields = fieldConfigs.length;
        const completedFields = Object.keys(formValues)
            .filter(key =>
                this.processor.formatter.shouldDisplayValue(formValues[key])
            )
            .length;
        return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    }
    /**
     * Determine form structure
     */
    determineFormStructure() {
        const steps = this.creatFormInstance.formConfig?.steps?.length || 1;
        return steps > 1 ? 'multi-step' : 'single-step';
    }
    /**
     * Get submission type
     */
    getSubmissionType() {
        return this.config.formType === "booking" ? "booking_form" : "submission_form";
    }
    /**
     * Get form version
     */
    getFormVersion() {
        return this.creatFormInstance?.defaultConfig?.FORM_VERSION || '1.0.0';
    }
}

export default BaseDataTransformer;

