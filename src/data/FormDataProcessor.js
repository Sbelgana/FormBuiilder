import FieldValueFormatter from "./FieldValueFormatter.js";
class FormDataProcessor {
    constructor(creatFormInstance) {
        this.creatFormInstance = creatFormInstance;
        this.formatter = new FieldValueFormatter(creatFormInstance);
        this.config = creatFormInstance?.config || {};
        this.language = this.config.language || 'fr';
    }
    /**
     * Process form data using field configurations (same approach as CustomField)
     */
    processFormData(originalFormValues) {
        const fieldConfigurations = this.getFieldConfigurations();
        const processedData = {};
        // Process each field value using its configuration
        Object.keys(originalFormValues)
            .forEach(fieldName => {
                const fieldValue = originalFormValues[fieldName];
                const fieldConfig = this.findFieldConfiguration(fieldName, fieldConfigurations);
                if (fieldConfig && this.formatter.shouldDisplayValue(fieldValue)) {
                    processedData[fieldName] = this.processFieldValue(fieldConfig, fieldValue, originalFormValues);
                }
            });
        return processedData;
    }
    /**
     * Process individual field value using the same technique as CustomField
     */
    processFieldValue(fieldConfig, fieldValue, allFormValues) {
        // Get the structured value extraction (like CustomField does)
        const structured = this.formatter.extractStructuredValue(fieldConfig, fieldValue);
        return {
            fieldId: fieldConfig.id || fieldConfig.name,
            fieldType: fieldConfig.type,
            label: this.getFieldLabel(fieldConfig),
            displayValue: structured.displayValue,
            rawValue: structured.rawValue,
            // For complex fields, include structured information
            ...(structured.hasSubFields && {
                mainValue: structured.mainValue,
                mainDisplayValue: structured.mainDisplayValue,
                subFields: structured.subFields
            }),
            // For array fields, provide different formats
            ...(Array.isArray(structured.displayValue) && {
                array: structured.displayValue,
                string: structured.displayValue.join(', '),
                count: structured.displayValue.length
            })
        };
    }
    /**
     * Get field configurations from the form (same as CustomField approach)
     */
    getFieldConfigurations() {
        const configs = [];
        if (this.creatFormInstance.formConfig?.steps) {
            this.creatFormInstance.formConfig.steps.forEach(stepConfig => {
                if (stepConfig.fields) {
                    configs.push(...this.extractFieldConfigs(stepConfig.fields));
                }
            });
        }
        return configs;
    }
    /**
     * Extract field configurations including nested fields (yesFields, noFields, etc.)
     */
    extractFieldConfigs(fields) {
        const configs = [];
        fields.forEach(fieldConfig => {
            configs.push(fieldConfig);
            // Extract nested field configurations
            if (fieldConfig.yesFields) {
                configs.push(...this.extractFieldConfigs(fieldConfig.yesFields));
            }
            if (fieldConfig.yesField) {
                configs.push(fieldConfig.yesField);
            }
            if (fieldConfig.noFields) {
                configs.push(...this.extractFieldConfigs(fieldConfig.noFields));
            }
            if (fieldConfig.noField) {
                configs.push(fieldConfig.noField);
            }
        });
        return configs;
    }
    /**
     * Find field configuration by name (same as CustomField approach)
     */
    findFieldConfiguration(fieldName, fieldConfigurations) {
        return fieldConfigurations.find(config =>
            (config.name === fieldName) ||
            (config.id === fieldName)
        ) || null;
    }
    /**
     * Get field label using the same approach as CustomField
     */
    getFieldLabel(fieldConfig) {
        const fieldId = fieldConfig.id || fieldConfig.name;
        // Try to get translated label
        if (this.creatFormInstance.getText) {
            const translatedLabel = this.creatFormInstance.getText(`fields.${fieldId}`);
            if (translatedLabel && translatedLabel !== `fields.${fieldId}`) {
                return translatedLabel;
            }
        }
        // Fallback to config label
        return fieldConfig.label || fieldId;
    }
    /**
     * Create sections based on form structure (not hardcoded field names)
     */
    createSections(processedData) {
        const sections = {};
        if (this.creatFormInstance.formConfig?.steps) {
            this.creatFormInstance.formConfig.steps.forEach((stepConfig, stepIndex) => {
                const sectionData = this.createSectionFromStep(stepConfig, stepIndex, processedData);
                if (Object.keys(sectionData)
                    .length > 0) {
                    const sectionId = this.getSectionId(stepConfig, stepIndex);
                    sections[sectionId] = {
                        sectionType: sectionId,
                        title: this.getSectionTitle(stepConfig, stepIndex),
                        index: stepIndex,
                        ...sectionData
                    };
                }
            });
        }
        return sections;
    }
    /**
     * Create section data from step configuration
     */
    createSectionFromStep(stepConfig, stepIndex, processedData) {
        const sectionData = {};
        if (stepConfig.fields) {
            stepConfig.fields.forEach(fieldConfig => {
                const fieldName = fieldConfig.id || fieldConfig.name;
                const fieldData = processedData[fieldName];
                if (fieldData) {
                    sectionData[fieldName] = fieldData;
                }
            });
        }
        return sectionData;
    }
    /**
     * Get section ID from step configuration
     */
    getSectionId(stepConfig, stepIndex) {
        if (stepConfig.sectionId) {
            return stepConfig.sectionId;
        }
        // Generate semantic section IDs based on content
        const fieldTypes = stepConfig.fields?.map(f => f.type) || [];
        if (fieldTypes.includes('email') || fieldTypes.includes('phone')) {
            return 'contact_information';
        }
        if (fieldTypes.includes('textarea') && stepConfig.fields?.some(f => f.id?.includes('description'))) {
            return 'project_details';
        }
        if (fieldTypes.includes('serviceCard') || fieldTypes.includes('calendar')) {
            return 'service_selection';
        }
        if (fieldTypes.includes('yesno-with-options')) {
            return 'feature_configuration';
        }
        return `step_${stepIndex}`;
    }
    /**
     * Get section title from step configuration
     */
    getSectionTitle(stepConfig, stepIndex) {
        // Try to get translated title
        if (this.creatFormInstance.getText) {
            const translatedTitle = this.creatFormInstance.getText(`steps.${stepIndex}.title`);
            if (translatedTitle && translatedTitle !== `steps.${stepIndex}.title`) {
                return translatedTitle;
            }
        }
        // Fallback to config title or generated title
        return stepConfig.title || `Step ${stepIndex + 1}`;
    }
}

export default FormDataProcessor;

